package com.medistock.medistock_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class SaleRequest {
    private String customerName;
    private String customerPhone;
    private String paymentMethod;
    private Double discountAmount;
    private List<CartItem> items;

    @Data
    public static class CartItem {
        private Long medicineId;
        private Integer quantity;
    }
}