package com.medistock.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

public final class ReturnDtos {
    private ReturnDtos() {}

    public record ReturnRequest(
        @NotNull(message = "Choose a batch") Long batchId,
        @NotNull(message = "Enter the quantity") @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 1000000, message = "Quantity is too large") Integer quantity,
        @NotBlank(message = "Choose a reason")
        @Pattern(regexp = "DAMAGED|EXPIRED|WRONG_ITEM|QUALITY_ISSUE|OVERSTOCK", message = "Choose a valid reason") String reason,
        @Size(max = 200, message = "Note is too long") String note) {}

    public record CreditRequest(
        @NotNull(message = "Enter the credit amount") @DecimalMin(value = "0", message = "Cannot be negative")
        @Digits(integer = 10, fraction = 2, message = "Up to 2 decimals") BigDecimal amount) {}

    /** status: Requested, Sent to supplier, Credited or Cancelled */
    public record ReturnResponse(Long id, Long batchId, String medicine, String batchNumber, String supplier, int quantity,
                                 String reason, String status, BigDecimal value, BigDecimal creditAmount, String note,
                                 String createdBy, Instant createdAt, Instant sentAt, Instant creditedAt) {}
}
