package com.medistock.medistock_backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MedicineRequest {
    private String name;
    private String batchNumber;
    private String category;
    private Long supplierId;
    private Integer quantity;
    private Integer minQuantity;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private Double unitPrice;
}