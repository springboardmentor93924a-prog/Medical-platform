package com.medistock.medistock.dto;

import java.math.BigDecimal;

public record PurchaseOrderItemRequestDto(Integer medicineId, Integer quantity, BigDecimal unitPrice) {
}
