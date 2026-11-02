
package com.medistock.security;

import com.medistock.entity.User;
import com.medistock.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

         

        if (header == null || !header.startsWith("Bearer ")) {
            System.out.println("[JWT] Missing Bearer token");
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        System.out.println("[JWT] Token contains whitespace: "
                + token.matches(".*\\s+.*"));

        try {
            String email = jwtService.extractEmail(token);

            if (jwtService.isTokenValid(token, email)
                    && SecurityContextHolder.getContext()
                            .getAuthentication() == null) {

                Optional<User> userOptional =
                        userRepository.findByEmail(email);

                if (userOptional.isEmpty()) {
                    System.out.println(
                            "[JWT] User not found in database");
                } else {
                    User user = userOptional.get();

                    if (!Boolean.TRUE.equals(user.getActive())) {
                        System.out.println(
                                "[JWT] User account is inactive");
                    } else {
                        String roleName = user.getRole().getRoleName();

                        SimpleGrantedAuthority authority =
                                new SimpleGrantedAuthority(
                                        "ROLE_" + roleName);

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        email,
                                        null,
                                        List.of(authority));

                        authentication.setDetails(
                                new WebAuthenticationDetailsSource()
                                        .buildDetails(request));

                        SecurityContextHolder.getContext()
                                .setAuthentication(authentication);

                
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println(
                    "[JWT] Validation failed: "
                            + ex.getClass().getSimpleName()
                            + " - " + ex.getMessage());

            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
