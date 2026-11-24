package com.medistock.medistock.config;

import com.medistock.medistock.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    private final JwtUtil jwtUtil;

    public WebSocketConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable in-memory broker for public topics and private user queues
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Primary SockJS endpoint for browser compatibility
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://127.0.0.1:5173",
                        "http://127.0.0.1:5174",
                        "http://localhost:3000",
                        "*"
                )
                .withSockJS();

        // Raw WebSocket endpoint without SockJS wrapper
        registry.addEndpoint("/ws-raw")
                .setAllowedOriginPatterns(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://127.0.0.1:5173",
                        "http://127.0.0.1:5174",
                        "http://localhost:3000",
                        "*"
                );
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null || authHeader.isBlank()) {
                        authHeader = accessor.getFirstNativeHeader("token");
                    }

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        authHeader = authHeader.substring(7);
                    }

                    if (authHeader != null && jwtUtil.validateToken(authHeader)) {
                        String email = jwtUtil.getEmailFromToken(authHeader);
                        String role = jwtUtil.getRoleFromToken(authHeader);
                        Integer userId = jwtUtil.getUserIdFromToken(authHeader);

                        String authorityRole = role != null ? role.toUpperCase() : "STAFF";
                        if (!authorityRole.startsWith("ROLE_")) {
                            authorityRole = "ROLE_" + authorityRole;
                        }

                        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                                new SimpleGrantedAuthority(authorityRole)
                        );

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(email, null, authorities);
                        accessor.setUser(auth);

                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            sessionAttributes.put("userId", userId);
                            sessionAttributes.put("role", authorityRole);
                            sessionAttributes.put("email", email);
                        }
                        log.info("[WebSocket] Authenticated user {} (id={}) with role {}", email, userId, authorityRole);
                    } else {
                        log.debug("[WebSocket] Anonymous or unauthenticated connect request");
                    }
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    java.security.Principal userPrincipal = accessor.getUser();

                    if (destination != null) {
                        // 1. Restrict Admin-only topics
                        if (destination.startsWith("/topic/admin/")) {
                            if (!(userPrincipal instanceof Authentication auth) ||
                                auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                                log.warn("[WebSocket] Unauthorized subscription attempt to admin topic: {}", destination);
                                throw new SecurityException("Unauthorized subscription: Admin privileges required");
                            }
                        }

                        // 2. Restrict Pharmacist topics (Admin and Pharmacist permitted)
                        if (destination.startsWith("/topic/pharmacist/")) {
                            if (!(userPrincipal instanceof Authentication auth) ||
                                auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PHARMACIST"))) {
                                log.warn("[WebSocket] Unauthorized subscription attempt to pharmacist topic: {}", destination);
                                throw new SecurityException("Unauthorized subscription: Pharmacist privileges required");
                            }
                        }

                        // 3. Restrict targeted user notifications topic /topic/notifications/{targetUserId}
                        if (destination.startsWith("/topic/notifications/")) {
                            String targetSuffix = destination.substring("/topic/notifications/".length()).trim();
                            if (!targetSuffix.isEmpty() && !targetSuffix.equalsIgnoreCase("all")) {
                                Integer sessionUserId = null;
                                Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                                if (sessionAttributes != null && sessionAttributes.get("userId") != null) {
                                    sessionUserId = (Integer) sessionAttributes.get("userId");
                                }
                                boolean isAdmin = false;
                                if (userPrincipal instanceof Authentication auth) {
                                    isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                                }
                                if (!isAdmin && (sessionUserId == null || !targetSuffix.equals(String.valueOf(sessionUserId)))) {
                                    log.warn("[WebSocket] Unauthorized subscription to private notifications: {} by user {}", destination, sessionUserId);
                                    throw new SecurityException("Unauthorized subscription: Cannot access private notifications of another user");
                                }
                            }
                        }
                    }
                } else if (StompCommand.SEND.equals(accessor.getCommand())) {
                    // Prevent users from broadcasting or mutating order states directly over WebSocket
                    String destination = accessor.getDestination();
                    if (destination != null && (destination.startsWith("/topic/") || destination.startsWith("/app/orders/status"))) {
                        log.warn("[WebSocket] Blocked direct client publication to {}", destination);
                        throw new SecurityException("Direct client broadcasting forbidden. Use REST APIs to perform operations.");
                    }
                }

                return message;
            }
        });
    }
}
