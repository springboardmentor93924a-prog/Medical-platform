package com.medistock.backend.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;

public final class StockCountDtos {
    private StockCountDtos() {}

    public record CountRequest(
        @NotNull(message = "Choose a batch") Long batchId,
        @NotNull(message = "Enter the quantity you counted")
        @Min(value = 0, message = "Quantity cannot be negative") @Max(value = 1000000, message = "Quantity is too large")
        Integer countedQuantity,
        @Size(max = 255, message = "Note is too long") String note) {}

    /** status: Matched, Discrepancy (a difference nobody has reviewed yet) or Reviewed */
    public record CountResponse(Long id, Long batchId, String medicine, String batchNumber,
                                int systemQuantity, int countedQuantity, int difference, String status, String note,
                                String countedBy, Instant countedAt, String reviewedBy, Instant reviewedAt) {}
}
