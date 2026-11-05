package com.medistock.medistock.dto;

import java.util.List;

public record PurchaseOrderRequestDto(Integer supplierId, List<PurchaseOrderItemRequestDto> items) {
}
