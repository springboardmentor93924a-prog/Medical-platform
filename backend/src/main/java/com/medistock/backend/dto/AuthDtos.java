package com.medistock.backend.dto;

import jakarta.validation.constraints.*;

public final class AuthDtos {
    private AuthDtos() {}

    public static final String PASSWORD_RULE = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,64}$";
    public static final String PASSWORD_MSG =
        "Password must be 8-64 characters with an uppercase letter, a lowercase letter, a number and a special character";
    public static final String EMAIL_RULE = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$";

    // "Admin" is intentionally NOT allowed here: admins are created by the seeder or by another admin
    public record SignupRequest(
        @NotBlank(message = "Username is required")
        @Pattern(regexp = "^[A-Za-z0-9_]{4,30}$", message = "Username must be 4-30 characters: letters, numbers or underscore")
        String username,
        @NotBlank(message = "Email is required") @Size(max = 120, message = "Email is too long")
        @Email(message = "Enter a valid email address")
        @Pattern(regexp = EMAIL_RULE, message = "Enter a valid email address")
        String email,
        @NotBlank(message = "Password is required")
        @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG)
        String password,
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
        String fullName,
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Enter a valid phone number (10-15 digits)")
        String phone,
        @NotBlank(message = "Role is required")
        @Pattern(regexp = "(?i)STAFF|PHARMACIST|SUPPLIER", message = "Role must be Staff, Pharmacist or Supplier")
        String role) {}

    public record LoginRequest(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password,
        @NotBlank(message = "Role is required") String role) {}

    public record ForgotPasswordRequest(
        @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email) {}

    public record ResetPasswordRequest(
        @NotBlank(message = "Token is required") String token,
        @NotBlank(message = "Password is required")
        @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG) String newPassword) {}

    public record AuthResponse(String token, String tokenType, long expiresInSeconds,
                               String username, String fullName, String role) {}
    public record UserResponse(Long id, String username, String email, String fullName, String phone, String role) {}
    public record MessageResponse(String message) {}
}
