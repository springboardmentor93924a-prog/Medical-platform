package com.medistock.controller;

import com.medistock.dto.request.*;
import com.medistock.dto.response.ApiResponse;
import com.medistock.dto.response.AuthResponse;
import com.medistock.dto.response.UserSummaryDto;
import com.medistock.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserSummaryDto>> register(@Valid @RequestBody RegisterRequest request) {
        UserSummaryDto response = authService.register(request);
        String msg = response.getStatus().name().equals("PENDING")
                ? "Registration submitted successfully. Your account is pending administrator approval before you can log in."
                : "Registration successful. You can now log in with your credentials.";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg, response));
    }

    @PostMapping("/admin-setup")
    public ResponseEntity<ApiResponse<UserSummaryDto>> adminSetup(@Valid @RequestBody AdminSetupRequest request) {
        UserSummaryDto response = authService.adminSetup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Administrator account configured successfully", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ApiResponse<String> response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ApiResponse<String> response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @GetMapping("/google/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGoogleAuthStatus() {
        return ResponseEntity.ok(ApiResponse.success("Google OAuth status retrieved", authService.getGoogleAuthStatus()));
    }

    @PostMapping("/google/login")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody Map<String, String> payload) {
        AuthResponse response = authService.googleLogin(payload);
        return ResponseEntity.ok(ApiResponse.success("Google sign-in successful", response));
    }
}
