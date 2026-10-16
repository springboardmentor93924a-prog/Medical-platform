
package com.medistock.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medistock.dto.auth.LoginRequest;
import com.medistock.dto.auth.LoginResponse;
import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import com.medistock.security.JwtService;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email, request.password()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalStateException("Authenticated user was not found."));

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        List<String> authorities =
                List.of("ROLE_" + user.getRole().getName());

        String token = jwtService.generateToken(email, authorities);

        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds());
    }
}
