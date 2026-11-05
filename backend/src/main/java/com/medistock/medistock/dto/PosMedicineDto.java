package com.medistock.medistock.dto;

import java.math.BigDecimal;

public record PosMedicineDto(
        Integer medicineId,
        String medicineName,
        String genericName,
        String dosage,
        Integer availableQuantity,
        BigDecimal sellingPrice) {
}
