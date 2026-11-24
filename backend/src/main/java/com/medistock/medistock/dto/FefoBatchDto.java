package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FefoBatchDto {

    private Integer batchId;
    private String batchNumber;
    private Integer medicineId;
    private String medicineName;
    private String brandName;
    private String genericName;
    private String categoryName;
    private Integer supplierId;
    private String supplierName;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private Integer quantityReceived;
    private Integer quantityAvailable;
    private BigDecimal purchaseCost;
    private BigDecimal sellingPrice;
    private String status; // ACTIVE, QUARANTINED, RECALLED, EXPIRED, DEPLETED
    private long daysUntilExpiry;
    private String daysLabel;
    private boolean expired;
    private boolean eligible;
    private String expiryAlertLevel; // EXPIRED, CRITICAL_7, NEAR_30, MODERATE_60, WARNING_90, VALID
    private String fefoRecommendation; // "Use first", "Next", "Later", "Expired", "Quarantined", "Out of Stock"
    private int fefoRank; // 1 = first, 2 = next, etc. (0 if not eligible)

    public FefoBatchDto() {}

    public Integer getBatchId() {
        return batchId;
    }

    public void setBatchId(Integer batchId) {
        this.batchId = batchId;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public Integer getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Integer medicineId) {
        this.medicineId = medicineId;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public LocalDate getManufacturingDate() {
        return manufacturingDate;
    }

    public void setManufacturingDate(LocalDate manufacturingDate) {
        this.manufacturingDate = manufacturingDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Integer getQuantityReceived() {
        return quantityReceived;
    }

    public void setQuantityReceived(Integer quantityReceived) {
        this.quantityReceived = quantityReceived;
    }

    public Integer getQuantityAvailable() {
        return quantityAvailable;
    }

    public void setQuantityAvailable(Integer quantityAvailable) {
        this.quantityAvailable = quantityAvailable;
    }

    public BigDecimal getPurchaseCost() {
        return purchaseCost;
    }

    public void setPurchaseCost(BigDecimal purchaseCost) {
        this.purchaseCost = purchaseCost;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getDaysUntilExpiry() {
        return daysUntilExpiry;
    }

    public void setDaysUntilExpiry(long daysUntilExpiry) {
        this.daysUntilExpiry = daysUntilExpiry;
    }

    public String getDaysLabel() {
        return daysLabel;
    }

    public void setDaysLabel(String daysLabel) {
        this.daysLabel = daysLabel;
    }

    public boolean isExpired() {
        return expired;
    }

    public void setExpired(boolean expired) {
        this.expired = expired;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public String getExpiryAlertLevel() {
        return expiryAlertLevel;
    }

    public void setExpiryAlertLevel(String expiryAlertLevel) {
        this.expiryAlertLevel = expiryAlertLevel;
    }

    public String getFefoRecommendation() {
        return fefoRecommendation;
    }

    public void setFefoRecommendation(String fefoRecommendation) {
        this.fefoRecommendation = fefoRecommendation;
    }

    public int getFefoRank() {
        return fefoRank;
    }

    public void setFefoRank(int fefoRank) {
        this.fefoRank = fefoRank;
    }
}

