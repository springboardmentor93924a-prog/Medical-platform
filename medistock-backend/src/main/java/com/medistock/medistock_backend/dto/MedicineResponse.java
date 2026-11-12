package com.medistock.medistock_backend.dto;

import com.medistock.medistock_backend.entity.Medicine;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MedicineResponse {
    private Long id;
    private String name;
    private String batchNumber;
    private String category;
    private Long supplierId;
    private String supplierName;
    private Integer quantity;
    private Integer minQuantity;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private Double unitPrice;
    private String status;
    private LocalDateTime updatedAt;

    private String genericName = "Generic formulation";
    private String storageCondition = "Room Temperature";
    private String unit = "units";


    private Boolean wastageFlag;
    private String wastageReason;

    public static MedicineResponse fromEntity(Medicine m) {
        MedicineResponse dto = new MedicineResponse();
        dto.setId(m.getId());
        dto.setName(m.getName());
        dto.setBatchNumber(m.getBatchNumber());
        dto.setCategory(m.getCategory());
        if (m.getSupplier() != null) {
            dto.setSupplierId(m.getSupplier().getId());
            dto.setSupplierName(m.getSupplier().getName());
        }
        dto.setQuantity(m.getQuantity());
        dto.setMinQuantity(m.getMinQuantity());
        dto.setManufacturingDate(m.getManufacturingDate());
        dto.setExpiryDate(m.getExpiryDate());
        dto.setUnitPrice(m.getUnitPrice());
        dto.setUpdatedAt(m.getUpdatedAt());


        dto.setWastageFlag(m.getWastageFlag() != null && m.getWastageFlag());
        dto.setWastageReason(m.getWastageReason());

        // Status calculation
        LocalDate today = LocalDate.now();
        if (m.getExpiryDate() != null && m.getExpiryDate().isBefore(today)) {
            dto.setStatus("EXPIRED");
        } else if (m.getQuantity() == 0) {
            dto.setStatus("OUT_OF_STOCK");
        } else if (m.getExpiryDate() != null && m.getExpiryDate().isBefore(today.plusDays(45))) {
            dto.setStatus("EXPIRING_SOON");
        } else if (m.getQuantity() <= m.getMinQuantity()) {
            dto.setStatus("LOW_STOCK");
        } else {
            dto.setStatus("IN_STOCK");
        }
        return dto;
    }
}