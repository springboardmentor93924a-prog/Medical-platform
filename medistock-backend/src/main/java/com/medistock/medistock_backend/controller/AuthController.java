package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.request.LoginRequest;
import com.medistock.medistock_backend.dto.response.LoginResponse;
import com.medistock.medistock_backend.dto.response.UserResponse;
import com.medistock.medistock_backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Public endpoint. Returns a JWT on success. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Requires a valid JWT. Returns the authenticated user's profile. */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(authService.currentUser(principal.getUsername()));
    }
}