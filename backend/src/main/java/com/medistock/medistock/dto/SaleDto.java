package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SaleDto(
        Integer saleId,
        String invoiceNumber,
        LocalDateTime saleDate,
        String customerName,
        String customerPhone,
        String paymentMethod,
        String paymentStatus,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        String cashier,
        List<SaleItemDto> items) {

    public record SaleItemDto(
            Integer medicineId,
            String medicineName,
            String batchNumber,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {
    }
}
