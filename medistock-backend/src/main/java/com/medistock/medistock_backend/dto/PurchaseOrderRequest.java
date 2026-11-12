package com.medistock.medistock_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class PurchaseOrderRequest {
    private Long supplierId;
    private List<OrderItemDto> items;

    @Data
    public static class OrderItemDto {
        private Long medicineId;
        private Integer quantity;
        private Double unitPrice;
    }
}