package com.medistock.backend.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;

public final class StockDtos {
    private StockDtos() {}

    public record StockUpdateRequest(
        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        @Max(value = 1000000, message = "Quantity is too large")
        Integer quantity,
        @Size(max = 255, message = "Note is too long")
        String note) {}

    public record StockLogResponse(Long id, Long batchId, String medicine, String batchNumber,
                                   int changeQuantity, int quantityAfter, String type,
                                   String note, String performedBy, Instant createdAt) {}
}
