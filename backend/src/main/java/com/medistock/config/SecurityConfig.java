
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

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(allowedOrigins.split("\\s*,\\s*"))
        );

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
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

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

                // Allow preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public endpoints
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/auth/**").permitAll()

                // Allow public access to uploaded profile pictures
                .requestMatchers("/uploads/**").permitAll()

                .requestMatchers("/error").permitAll()

                // AI recommendations
                .requestMatchers("/api/ai-recommendations/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Built-in assistant (answers from local data only)
                .requestMatchers("/api/assistant/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Medicine returns: suppliers submit, pharmacists decide
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/returns"
                ).hasAnyRole("PHARMACIST", "SUPPLIER")

                .requestMatchers(
                        HttpMethod.POST,
                        "/api/returns"
                ).hasRole("SUPPLIER")

                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/returns/*/decision"
                ).hasRole("PHARMACIST")

                // Inventory endpoints
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/inventory/**"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                .requestMatchers("/api/inventory/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Stock movement endpoints
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/stock-movements/**"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                .requestMatchers("/api/stock-movements/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                // Staff submits stock check reports
                .requestMatchers(
                        HttpMethod.POST,
                        "/api/stock-check-reports"
                ).hasRole("STAFF")

                // Staff views their own reports
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/stock-check-reports/my"
                ).hasRole("STAFF")

                // Admin and Pharmacist view all reports
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/stock-check-reports/all"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                // Admin and Pharmacist approve or reject reports
                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/stock-check-reports/**"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                // User Profile endpoints
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/profile"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/profile"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                // Notifications - all roles can access their own notifications
                .requestMatchers("/api/notifications/**")
                .hasAnyRole("ADMIN", "PHARMACIST", "STAFF", "SUPPLIER")

                // Reports
                .requestMatchers("/api/reports/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Search
                .requestMatchers("/api/search/**").authenticated()

                // =====================================
                // PURCHASE ORDER ENDPOINTS
                // =====================================

                // Staff, Admin and Pharmacist can view orders ready to receive
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/purchase-orders/ready-to-receive"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                // Staff can view purchase order items
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/purchase-orders/*/items"
                ).hasAnyRole("ADMIN", "PHARMACIST", "SUPPLIER", "STAFF")

                // Staff can receive approved purchase orders
                .requestMatchers(
                        HttpMethod.POST,
                        "/api/purchase-orders/*/receive"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                // General purchase order GET permissions
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/purchase-orders/**",
                        "/api/admin/purchase-orders/**"
                ).hasAnyRole("ADMIN", "PHARMACIST", "SUPPLIER")

                // General purchase order write permissions
                .requestMatchers(
                        "/api/purchase-orders/**",
                        "/api/admin/purchase-orders/**"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                // =====================================
                // SUPPLIER ENDPOINTS
                // =====================================

                // Admin and Pharmacist can view suppliers
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/admin/suppliers/**"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                // Admin and Pharmacist can add suppliers
                .requestMatchers(
                        HttpMethod.POST,
                        "/api/admin/suppliers/**"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                // =====================================
                // MEDICINE ENDPOINTS
                // =====================================

                // Staff can VIEW medicines for expiry checking
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/admin/medicines",
                        "/api/admin/medicines/**"
                ).hasAnyRole("ADMIN", "PHARMACIST", "STAFF")

                // Only Admin and Pharmacist can modify medicines
                .requestMatchers(
                        "/api/admin/medicines/**"
                ).hasAnyRole("ADMIN", "PHARMACIST")

                // Admin-only endpoints
                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                // General medicine endpoints
                .requestMatchers("/api/medicines/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Pharmacist endpoints
                .requestMatchers("/api/pharmacist/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")

                // Supplier endpoints
                .requestMatchers("/api/supplier/**")
                    .hasRole("SUPPLIER")

                // FEFO medicine dispensing
                .requestMatchers("/api/fefo/**")
                .hasAnyRole("ADMIN", "PHARMACIST")

                // All remaining endpoints require authentication
                .anyRequest().authenticated()
            )

            .exceptionHandling(ex -> ex

                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                            "{\"message\":\"Authentication required\"}"
                    );
                })

                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                            "{\"message\":\"Access denied for your role\"}"
                    );
                })
            )

            // JWT authentication filter
            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
