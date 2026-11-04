
package com.medistock.security;

import com.medistock.entity.User;
import com.medistock.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger =
            LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {

        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }


    @Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    return request.getServletPath().startsWith("/uploads/");
}

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        // No JWT token: continue to the next filter
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7).trim();

        try {

            // Extract email from JWT
            String email = jwtService.extractEmail(token);

            // Validate token
            if (email != null
                    && jwtService.isTokenValid(token, email)
                    && SecurityContextHolder.getContext()
                            .getAuthentication() == null) {

                Optional<User> userOptional =
                        userRepository.findByEmail(email);

                if (userOptional.isPresent()) {

                    User user = userOptional.get();

                    // Check user account status
                    if (!Boolean.TRUE.equals(user.getActive())) {
                        logger.warn(
                                "Inactive user attempted access: {}",
                                email
                        );

                        filterChain.doFilter(request, response);
                        return;
                    }

                    // Check role
                    if (user.getRole() == null
                            || user.getRole().getRoleName() == null) {

                        logger.warn(
                                "User has no assigned role: {}",
                                email
                        );

                        filterChain.doFilter(request, response);
                        return;
                    }

                    // Normalize database role
                    String roleName = user.getRole()
                            .getRoleName()
                            .trim()
                            .toUpperCase(Locale.ROOT);

                    // Avoid duplicate ROLE_ prefix
                    if (roleName.startsWith("ROLE_")) {
                        roleName = roleName.substring(5);
                    }

                    // Create Spring Security authority
                    SimpleGrantedAuthority authority =
                            new SimpleGrantedAuthority(
                                    "ROLE_" + roleName
                            );

                    // Create authentication object
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    List.of(authority)
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    // Store authentication
                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);

                    logger.info(
                            "JWT authenticated user: {} | Authority: ROLE_{}",
                            email,
                            roleName
                    );

                } else {
                    logger.warn(
                            "JWT user not found in database: {}",
                            email
                    );
                }
            }

        } catch (Exception ex) {

            logger.error(
                    "JWT validation failed: {}",
                    ex.getMessage()
            );

            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
