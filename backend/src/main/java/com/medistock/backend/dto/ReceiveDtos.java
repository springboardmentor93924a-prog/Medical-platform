package com.medistock.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public final class ReceiveDtos {
    private ReceiveDtos() {}

    /** Batch details for one item of the order, entered when the goods arrive. */
    public record ReceiveItem(
        @NotNull(message = "Item is required") Long itemId,
        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative") @Max(value = 1000000, message = "Quantity is too large")
        Integer quantity,   // units arriving now. 0 means nothing from this item this time.
        @Pattern(regexp = "^[A-Za-z0-9/_-]{1,40}$", message = "Batch number: letters, numbers, - _ / (max 40)")
        String batchNumber,
        LocalDate manufacturingDate,
        LocalDate expiryDate) {}   // batch details are required only when quantity is above 0

    public record ReceiveRequest(
        @NotEmpty(message = "Give batch details for every item") @Valid List<ReceiveItem> items) {}
}
