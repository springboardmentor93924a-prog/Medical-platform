package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PurchaseOrderDto(
        Integer purchaseOrderId,
        String poNumber,
        Integer supplierId,
        String supplierName,
        String supplierContactPerson,
        LocalDate orderDate,
        String status,
        BigDecimal totalAmount,
        String issuedBy,
        List<PurchaseOrderItemDto> items) {

    public record PurchaseOrderItemDto(
            Integer medicineId,
            String medicineName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {
    }
}
