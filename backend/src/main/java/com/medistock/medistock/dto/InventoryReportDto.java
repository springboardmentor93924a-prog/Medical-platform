package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventoryReportDto(
        Integer medicineId,
        String medicineName,
        String genericName,
        String category,
        String batchNumber,
        String supplierName,
        Integer quantity,
        Integer reorderLevel,
        BigDecimal purchasePrice,
        BigDecimal sellingPrice,
        LocalDate expiryDate) {
}
