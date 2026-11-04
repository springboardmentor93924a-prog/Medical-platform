package com.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class InventoryMedicineDTO {

    private Long inventoryId;
    private Long medicineId;
    private String medicineName;
    private String category;
    private String description;
    private Long supplierId;
    private String batchNumber;
    private Integer quantity;
    private Integer minimumStock;
    private BigDecimal unitPrice;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;

    public InventoryMedicineDTO(
            Long inventoryId,
            Long medicineId,
            String medicineName,
            String category,
            String description,
            Long supplierId,
            String batchNumber,
            Integer quantity,
            Integer minimumStock,
            BigDecimal unitPrice,
            LocalDate manufacturingDate,
            LocalDate expiryDate
    ) {
        this.inventoryId = inventoryId;
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.category = category;
        this.description = description;
        this.supplierId = supplierId;
        this.batchNumber = batchNumber;
        this.quantity = quantity;
        this.minimumStock = minimumStock;
        this.unitPrice = unitPrice;
        this.manufacturingDate = manufacturingDate;
        this.expiryDate = expiryDate;
    }

    public Long getInventoryId() { return inventoryId; }
    public Long getMedicineId() { return medicineId; }
    public String getMedicineName() { return medicineName; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public Long getSupplierId() { return supplierId; }
    public String getBatchNumber() { return batchNumber; }
    public Integer getQuantity() { return quantity; }
    public Integer getMinimumStock() { return minimumStock; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
}