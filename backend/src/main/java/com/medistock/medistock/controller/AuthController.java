package com.medistock.medistock.controller;

import com.medistock.medistock.dto.LoginRequest;
import com.medistock.medistock.dto.LoginResponse;
import com.medistock.medistock.dto.UserProfileResponse;
import com.medistock.medistock.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final com.medistock.medistock.service.AuditService auditService;
    private final com.medistock.medistock.service.OtpService otpService;

    public AuthController(AuthService authService,
                          com.medistock.medistock.service.AuditService auditService,
                          com.medistock.medistock.service.OtpService otpService) {
        this.authService = authService;
        this.auditService = auditService;
        this.otpService = otpService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   BindingResult bindingResult,
                                   jakarta.servlet.http.HttpServletRequest httpRequest) {

        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getAllErrors().getFirst().getDefaultMessage();
            return ResponseEntity.badRequest().body(Map.of("message", errorMsg != null ? errorMsg : "Validation error"));
        }

        try {
            LoginResponse response = authService.login(request);
            auditService.logEvent(
                    response.getUserId(),
                    response.getRole(),
                    "LOGIN_SUCCESS",
                    "AUTH",
                    "USER",
                    response.getUserId(),
                    null,
                    null,
                    "User logged in: " + response.getEmail(),
                    "SUCCESS",
                    httpRequest
            );
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException ex) {
            auditService.logEvent(
                    null,
                    "ANONYMOUS",
                    "LOGIN_FAILED",
                    "AUTH",
                    "USER",
                    null,
                    null,
                    null,
                    request.getEmail(),
                    "FAILED",
                    httpRequest
            );
            String message = ex.getMessage();
            if (message == null || message.isBlank() || message.equalsIgnoreCase("Bad credentials")) {
                message = "Invalid email or password";
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", message));
        } catch (DisabledException ex) {
            auditService.logEvent(
                    null,
                    "ANONYMOUS",
                    "LOGIN_BLOCKED",
                    "AUTH",
                    "USER",
                    null,
                    null,
                    null,
                    "Disabled account: " + request.getEmail(),
                    "BLOCKED",
                    httpRequest
            );
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An error occurred during authentication"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName();
        try {
            UserProfileResponse profile = authService.getProfileByEmail(email);
            return ResponseEntity.ok(profile);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody Map<String, String> body) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }
        try {
            String email = authentication.getName();
            String fullName = body.get("fullName");
            String phone = body.get("phone");
            String currentPassword = body.get("currentPassword");
            String newPassword = body.get("newPassword");

            UserProfileResponse updated = authService.updateProfile(email, fullName, phone, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Profile updated successfully",
                    "data", updated
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update profile: " + ex.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody com.medistock.medistock.dto.RegisterRequest request,
                                      BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getAllErrors().getFirst().getDefaultMessage();
            return ResponseEntity.badRequest().body(Map.of("message", errorMsg != null ? errorMsg : "Validation error"));
        }

        try {
            LoginResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to register user account: " + ex.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody com.medistock.medistock.dto.RegisterRequest request,
                                    BindingResult bindingResult) {
        return register(request, bindingResult);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DUAL-CHANNEL REAL-TIME OTP ENDPOINTS (BYPASSED / AUTO-VERIFIED)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping({"/verify-email-otp", "/otp/verify-email"})
    public ResponseEntity<?> verifyEmailOtp(@RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "verified", true,
                "fullyVerified", true,
                "message", "Email verification is bypassed. Account is active."
        ));
    }

    @PostMapping({"/verify-phone-otp", "/otp/verify-phone"})
    public ResponseEntity<?> verifyPhoneOtp(@RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "verified", true,
                "fullyVerified", true,
                "message", "Phone verification is bypassed. Account is active."
        ));
    }

    @PostMapping({"/resend-otp", "/otp/resend"})
    public ResponseEntity<?> resendOtp(@RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP verification is not required for this system."
        ));
    }

    @GetMapping({"/verification-status", "/otp/status"})
    public ResponseEntity<?> getVerificationStatus(@RequestParam(name = "email", required = false) String email) {
        return ResponseEntity.ok(Map.of(
                "found", true,
                "emailVerified", true,
                "phoneVerified", true,
                "fullyVerified", true,
                "status", "VERIFIED"
        ));
    }

    @GetMapping("/roles")
    public ResponseEntity<java.util.List<com.medistock.medistock.entity.Role>> getRoles() {
        return ResponseEntity.ok(authService.getAllRoles());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String identifier = body.get("email");
        if (identifier == null || identifier.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address or username is required"));
        }

        // Generate token and in production dispatch via secure email/SMS service
        authService.requestPasswordReset(identifier);

        // Security rule: Always respond with a generic success message without leaking the resetToken or account existence
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "If an account matches '" + identifier + "', a secure password reset link has been dispatched to your email."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset token is required"));
        }
        if (newPassword == null || newPassword.trim().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 8 characters long"));
        }

        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password has been successfully updated. You may now sign in."
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to reset password: " + ex.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User session successfully logged out."
        ));
    }
}
