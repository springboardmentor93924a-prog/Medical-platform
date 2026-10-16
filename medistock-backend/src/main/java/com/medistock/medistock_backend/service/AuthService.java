package com.medistock.medistock_backend.service;

import com.medistock.medistock_backend.dto.request.LoginRequest;
import com.medistock.medistock_backend.dto.response.LoginResponse;
import com.medistock.medistock_backend.dto.response.UserResponse;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.exception.ApiException;
import com.medistock.medistock_backend.repository.UserRepository;
import com.medistock.medistock_backend.security.CustomUserDetails;
import com.medistock.medistock_backend.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final long expirationMs;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtService jwtService,
                       @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.expirationMs = expirationMs;
    }

    public LoginResponse login(LoginRequest req) {
        // 1. Authenticate — throws BadCredentialsException on failure,
        //    which GlobalExceptionHandler converts to a 401 with a generic message.
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        // 2. auth.getPrincipal() is our CustomUserDetails
        CustomUserDetails principal = (CustomUserDetails) auth.getPrincipal();
        User user = principal.getUser();

        // 3. Extract the primary role for the JWT payload.
        //    (If multiple roles exist, we use the first one for display purposes.
        //     The database still stores all roles; frontend can call /me to see them all.)
        String primaryRole = user.getRoles().stream()
                .map(r -> r.getName())
                .findFirst()
                .orElse("STAFF");

        String token = jwtService.generateToken(
                user.getEmail(),
                Map.of("role", primaryRole, "uid", user.getId())
        );

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(expirationMs)
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse currentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .enabled(u.isEnabled())
                .roles(u.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()))
                .build();
    }
}