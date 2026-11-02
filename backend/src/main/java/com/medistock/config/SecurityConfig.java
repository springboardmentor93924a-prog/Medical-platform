
package com.medistock.config;

import com.medistock.security.JwtAuthenticationFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // CORS configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(allowedOrigins.split("\\s*,\\s*"))
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type")
        );

        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    // Spring Security filter chain
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())

            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Allow preflight requests
                .requestMatchers(
                        HttpMethod.OPTIONS, "/**"
                ).permitAll()

                // Public endpoints
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/error").permitAll()

                // Inventory endpoints
                .requestMatchers(
                        HttpMethod.GET, "/api/inventory/**"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                .requestMatchers("/api/inventory/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Stock movement endpoints
                .requestMatchers(
                        HttpMethod.GET, "/api/stock-movements/**"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                .requestMatchers("/api/stock-movements/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                // Notification endpoints
                .requestMatchers("/api/notifications/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                // Reports
                .requestMatchers("/api/reports/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Search
                .requestMatchers("/api/search/**")
                    .authenticated()

                // Purchase orders
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/purchase-orders/**",
                        "/api/admin/purchase-orders/**"
                ).hasAnyRole("ADMIN", "PHARMACIST", "SUPPLIER")

                .requestMatchers(
                        "/api/purchase-orders/**",
                        "/api/admin/purchase-orders/**"
                )
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Admin suppliers read & create (allowed for Admin and Pharmacist)
                .requestMatchers(
                        HttpMethod.GET, "/api/admin/suppliers/**"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                .requestMatchers(
                        HttpMethod.POST, "/api/admin/suppliers/**"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                // Admin medicine endpoints
                .requestMatchers("/api/admin/medicines/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Admin-only endpoints
                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                // General medicine endpoints
                .requestMatchers("/api/medicines/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Pharmacist dashboard, medicine CRUD and stock monitoring
                .requestMatchers("/api/pharmacist/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Supplier endpoints
                .requestMatchers("/api/supplier/**")
                    .hasRole("SUPPLIER")

                // All other endpoints require authentication
                .anyRequest().authenticated()
            )

            // Authentication and authorization error responses
            .exceptionHandling(ex -> ex

                .authenticationEntryPoint(
                    (request, response, authException) -> {
                        response.setStatus(401);
                        response.setContentType(
                                "application/json;charset=UTF-8"
                        );
                        response.getWriter().write(
                                "{\"message\":\"Authentication required\"}"
                        );
                    }
                )

                .accessDeniedHandler(
                    (request, response, accessDeniedException) -> {
                        response.setStatus(403);
                        response.setContentType(
                                "application/json;charset=UTF-8"
                        );
                        response.getWriter().write(
                                "{\"message\":\"Access denied for your role\"}"
                        );
                    }
                )
            )

            // JWT authentication filter
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
