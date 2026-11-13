package com.medistock.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class InventoryDtos {
    private InventoryDtos() {}

    /** Used to add a medicine with its first batch, and to edit a batch's details. */
    public record InventoryRequest(
        @NotBlank(message = "Medicine name is required")
        @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
        String name,
        @NotBlank(message = "Batch number is required")
        @Pattern(regexp = "^[A-Za-z0-9/_-]{1,40}$", message = "Batch number: letters, numbers, - _ / (max 40)")
        String batchNumber,
        @NotNull(message = "Category is required") Long categoryId,
        @NotNull(message = "Supplier is required") Long supplierId,
        @Min(value = 0, message = "Quantity cannot be negative") @Max(value = 1000000, message = "Quantity is too large")
        Integer quantity,   // needed when adding; ignored when editing (stock changes have their own endpoint)
        @NotNull(message = "Reorder level is required")
        @Min(value = 0, message = "Reorder level cannot be negative") @Max(value = 100000, message = "Reorder level is too large")
        Integer reorderLevel,
        @NotNull(message = "Manufacturing date is required") LocalDate manufacturingDate,
        @NotNull(message = "Expiry date is required") LocalDate expiryDate,
        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        @Digits(integer = 8, fraction = 2, message = "Price can have up to 2 decimals")
        BigDecimal price) {}

    /** One row of the Inventory page: a batch together with its medicine and supplier. */
    public record InventoryRow(
        Long batchId, Long medicineId, String name, String batchNumber,
        Long categoryId, String category, Long supplierId, String supplier,
        int quantity, int reorderLevel, LocalDate manufacturingDate, LocalDate expiryDate,
        BigDecimal price, String stockStatus, String expiryStatus, long daysToExpiry) {}
}
