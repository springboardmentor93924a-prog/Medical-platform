package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.AuthResponse;
import com.medistock.medistock_backend.dto.LoginRequest;
import com.medistock.medistock_backend.dto.RegisterRequest;
import com.medistock.medistock_backend.service.AuditService;
import com.medistock.medistock_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuditService auditService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);

        try {
            String role = "UNKNOWN";
            if (response.getUser() != null && response.getUser().getRoles() != null
                    && !response.getUser().getRoles().isEmpty()) {
                role = response.getUser().getRoles().get(0).replace("ROLE_", "");
            }

            auditService.log(
                    "LOGIN",
                    "AUTH",
                    response.getUser() != null ? response.getUser().getId() : null,
                    "Successful login by " + request.getEmail() + " (role: " + role + ")"
            );
        } catch (Exception e) {
            System.err.println("Login audit failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> getMe(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    // ============================================================
    // UPDATE OWN PROFILE — works for ALL roles
    // (Admin, Pharmacist, Staff, Supplier)
    // ============================================================
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> updates,
            Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Not authenticated"));
            }
            Map<String, Object> result = authService.updateProfile(authentication.getName(), updates);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }
}