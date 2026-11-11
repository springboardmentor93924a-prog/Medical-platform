package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MedicineCatalogDto {

    private final Integer medicineId;
    private final String medicineCode;
    private final String medicineName;
    private final String genericName;
    private final String manufacturer;
    private final String category;
    private final String dosage;
    private final Boolean prescriptionRequired;
    private final Integer batchId;
    private final String batchNumber;
    private final Integer quantity;
    private final Integer reorderLevel;
    private final BigDecimal purchasePrice;
    private final BigDecimal sellingPrice;
    private final LocalDate expiryDate;
    private final String supplierName;
    private final String supplierContactPerson;
    private final String supplierContactNumber;
    private final String supplierEmail;
    private final Integer supplierId;
    private final String rackLocation;

    public MedicineCatalogDto(
            Integer medicineId,
            String medicineCode,
            String medicineName,
            String genericName,
            String manufacturer,
            String category,
            String dosage,
            Boolean prescriptionRequired,
            Integer batchId,
            String batchNumber,
            Integer quantity,
            Integer reorderLevel,
            BigDecimal purchasePrice,
            BigDecimal sellingPrice,
            LocalDate expiryDate,
            String supplierName,
            String supplierContactPerson,
            String supplierContactNumber,
            String supplierEmail,
            Integer supplierId,
            String rackLocation) {
        this.medicineId = medicineId;
        this.medicineCode = medicineCode;
        this.medicineName = medicineName;
        this.genericName = genericName;
        this.manufacturer = manufacturer;
        this.category = category;
        this.dosage = dosage;
        this.prescriptionRequired = prescriptionRequired;
        this.batchId = batchId;
        this.batchNumber = batchNumber;
        this.quantity = quantity;
        this.reorderLevel = reorderLevel;
        this.purchasePrice = purchasePrice;
        this.sellingPrice = sellingPrice;
        this.expiryDate = expiryDate;
        this.supplierName = supplierName;
        this.supplierContactPerson = supplierContactPerson;
        this.supplierContactNumber = supplierContactNumber;
        this.supplierEmail = supplierEmail;
        this.supplierId = supplierId;
        this.rackLocation = rackLocation;
    }

    public Integer getMedicineId() { return medicineId; }
    public String getMedicineCode() { return medicineCode; }
    public String getMedicineName() { return medicineName; }
    public String getGenericName() { return genericName; }
    public String getManufacturer() { return manufacturer; }
    public String getCategory() { return category; }
    public String getDosage() { return dosage; }
    public Boolean getPrescriptionRequired() { return prescriptionRequired; }
    public Integer getBatchId() { return batchId; }
    public String getBatchNumber() { return batchNumber; }
    public Integer getQuantity() { return quantity; }
    public Integer getReorderLevel() { return reorderLevel; }
    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public BigDecimal getSellingPrice() { return sellingPrice; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public String getSupplierName() { return supplierName; }
    public String getSupplierContactPerson() { return supplierContactPerson; }
    public String getSupplierContactNumber() { return supplierContactNumber; }
    public String getSupplierEmail() { return supplierEmail; }
    public Integer getSupplierId() { return supplierId; }
    public String getRackLocation() { return rackLocation; }
}