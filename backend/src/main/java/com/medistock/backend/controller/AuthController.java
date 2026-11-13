package com.medistock.backend.controller;

import com.medistock.backend.dto.AuthDtos.*;
import com.medistock.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/signup")
    public ResponseEntity<MessageResponse> signup(@Valid @RequestBody SignupRequest r) {
        auth.signup(r);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse("Account created. You can now sign in."));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) { return auth.login(r); }

    @PostMapping("/forgot-password")
    public MessageResponse forgot(@Valid @RequestBody ForgotPasswordRequest r) {
        auth.forgotPassword(r.email());
        return new MessageResponse("If that email is registered, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public MessageResponse reset(@Valid @RequestBody ResetPasswordRequest r) {
        auth.resetPassword(r);
        return new MessageResponse("Password updated. You can now sign in.");
    }

    @GetMapping("/me")   // protected: needs a valid Bearer token
    public UserResponse me(Authentication authentication) { return auth.me(authentication.getName()); }
}
