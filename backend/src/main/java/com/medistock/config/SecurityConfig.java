
package com.medistock.config;

import com.medistock.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

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
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/inventory/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "STAFF")
                .requestMatchers("/api/inventory/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")
                .requestMatchers(HttpMethod.GET, "/api/stock-movements/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "STAFF")
                .requestMatchers("/api/stock-movements/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "STAFF")
                .requestMatchers("/api/notifications/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "STAFF")
                .requestMatchers("/api/reports/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")
                .requestMatchers("/api/search/**")
                    .authenticated()
                .requestMatchers(HttpMethod.GET, "/api/purchase-orders/**")
                    .hasAnyRole("ADMIN", "PHARMACIST", "SUPPLIER")
                .requestMatchers("/api/purchase-orders/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")
                .requestMatchers("/api/admin/medicines/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")
                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                .requestMatchers("/api/medicines/**")
                    .hasAnyRole("ADMIN", "PHARMACIST")
                .requestMatchers("/api/supplier/**").hasRole("SUPPLIER")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"message\":\"Authentication required\"}");
                })
                // Write 403 directly instead of sendError(): sendError triggers an
                // ERROR dispatch that re-enters the security chain without the
                // request-scoped SecurityContext and wrongly downgrades 403 -> 401.
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"message\":\"Access denied for your role\"}");
                })
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
