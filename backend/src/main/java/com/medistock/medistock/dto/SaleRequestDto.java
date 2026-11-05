package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.util.List;

public record SaleRequestDto(
        String customerName,
        String customerPhone,
        String paymentMethod,
        BigDecimal discountAmount,
        List<SaleItemRequestDto> items) {

    public record SaleItemRequestDto(Integer medicineId, Integer quantity) {
    }
}
