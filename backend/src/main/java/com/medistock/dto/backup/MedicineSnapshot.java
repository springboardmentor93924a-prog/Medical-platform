package com.medistock.dto.backup;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MedicineSnapshot {
    private Long id;
    private String name;
    private String genericName;
    private String batchNumber;
    private String categoryName;
    private String supplierCompanyName;
    private Integer quantity;
    private Integer minimumStockLevel;
    private BigDecimal unitPrice;
    private String dosageForm;
    private String storageConditions;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String description;
    private String status;
    private LocalDateTime createdAt;

    public MedicineSnapshot() {}

    public MedicineSnapshot(Long id, String name, String genericName, String batchNumber,
                            String categoryName, String supplierCompanyName, Integer quantity,
                            Integer minimumStockLevel, BigDecimal unitPrice, String dosageForm,
                            String storageConditions, LocalDate manufacturingDate, LocalDate expiryDate,
                            String description, String status, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.genericName = genericName;
        this.batchNumber = batchNumber;
        this.categoryName = categoryName;
        this.supplierCompanyName = supplierCompanyName;
        this.quantity = quantity;
        this.minimumStockLevel = minimumStockLevel;
        this.unitPrice = unitPrice;
        this.dosageForm = dosageForm;
        this.storageConditions = storageConditions;
        this.manufacturingDate = manufacturingDate;
        this.expiryDate = expiryDate;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getSupplierCompanyName() { return supplierCompanyName; }
    public void setSupplierCompanyName(String supplierCompanyName) { this.supplierCompanyName = supplierCompanyName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getMinimumStockLevel() { return minimumStockLevel; }
    public void setMinimumStockLevel(Integer minimumStockLevel) { this.minimumStockLevel = minimumStockLevel; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public String getDosageForm() { return dosageForm; }
    public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }

    public String getStorageConditions() { return storageConditions; }
    public void setStorageConditions(String storageConditions) { this.storageConditions = storageConditions; }

    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
