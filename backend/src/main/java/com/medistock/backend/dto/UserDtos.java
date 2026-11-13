package com.medistock.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;

public final class UserDtos {
    private UserDtos() {}

    public record UserSummary(Long id, String username, String fullName, String email, String phone,
                              String role, boolean active, Long supplierId, String supplierName, Instant createdAt) {}

    /** What an Admin can change on another account. supplierId is only used for the Supplier role. */
    public record UserUpdateRequest(
        @NotBlank(message = "Role is required")
        @Pattern(regexp = "(?i)ADMIN|PHARMACIST|STAFF|SUPPLIER", message = "Role must be Admin, Pharmacist, Staff or Supplier")
        String role,
        @NotNull(message = "Active is required") Boolean active,
        Long supplierId) {}
}
