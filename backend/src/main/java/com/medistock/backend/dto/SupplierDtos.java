package com.medistock.backend.dto;

import jakarta.validation.constraints.*;

public final class SupplierDtos {
    private SupplierDtos() {}

    public record SupplierRequest(
        @NotBlank(message = "Supplier name is required")
        @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
        String name,
        @NotBlank(message = "Contact number is required")
        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Enter a valid phone number (10-15 digits)")
        String phone,
        @NotBlank(message = "Email is required") @Size(max = 120, message = "Email is too long")
        @Email(message = "Enter a valid email address")
        @Pattern(regexp = AuthDtos.EMAIL_RULE, message = "Enter a valid email address")
        String email,
        @NotBlank(message = "Address is required")
        @Size(min = 5, max = 255, message = "Address must be 5-255 characters")
        String address,
        Boolean active) {}   // optional: leave out to keep the current value (new suppliers are active)

    public record SupplierResponse(Long id, String name, String phone, String email, String address, boolean active) {}
}
