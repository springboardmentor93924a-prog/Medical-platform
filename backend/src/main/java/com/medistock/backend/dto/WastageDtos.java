package com.medistock.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class WastageDtos {
    private WastageDtos() {}

    /** reason: DAMAGED, LOST or OTHER. Expired stock is removed from the Expiry page. */
    public record WastageRequest(
        @NotNull(message = "Choose a batch") Long batchId,
        @NotNull(message = "Enter the quantity") @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 1000000, message = "Quantity is too large") Integer quantity,
        @NotBlank(message = "Choose a reason") @Pattern(regexp = "DAMAGED|LOST|OTHER", message = "Reason must be Damaged, Lost or Other") String reason,
        @Size(max = 200, message = "Note is too long") String note) {}

    public record WastageRow(Instant time, String medicine, String batchNumber, String reason, int quantity,
                             BigDecimal value, String note, String by) {}
    public record Slice(String label, long units, long value) {}
    public record MonthValue(String label, long value) {}
    public record TopLoss(String medicine, long units, long value) {}

    public record WastageResponse(long totalUnits, long totalValue, List<Slice> byReason, List<MonthValue> byMonth,
                                  List<TopLoss> topMedicines, List<WastageRow> records) {}
}
