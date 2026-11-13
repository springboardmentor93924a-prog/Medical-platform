package com.medistock.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    public record OrderItemRequest(
        @NotNull(message = "Medicine is required") Long medicineId,
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1") @Max(value = 1000000, message = "Quantity is too large")
        Integer quantity,
        @NotNull(message = "Unit price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        @Digits(integer = 8, fraction = 2, message = "Price can have up to 2 decimals")
        BigDecimal unitPrice) {}

    public record OrderRequest(
        @NotNull(message = "Supplier is required") Long supplierId,
        LocalDate expectedDate,
        @Size(max = 255, message = "Notes are too long") String notes,
        @NotEmpty(message = "Add at least one medicine") @Size(max = 50, message = "Too many items in one order")
        @Valid List<OrderItemRequest> items) {}

    public record OrderItemResponse(Long itemId, Long medicineId, String medicine, int quantity, BigDecimal unitPrice, int receivedQuantity) {}

    public record OrderResponse(Long id, String orderNumber, Long supplierId, String supplier, String status,
                                LocalDate expectedDate, String notes, String createdBy, Instant createdAt,
                                Instant deliveredAt, BigDecimal totalAmount, List<OrderItemResponse> items,
                                String reviewedBy, Instant reviewedAt, String rejectionReason) {}

    public record RejectRequest(
        @NotBlank(message = "Please give a reason") @Size(max = 255, message = "Reason is too long") String reason) {}
}
