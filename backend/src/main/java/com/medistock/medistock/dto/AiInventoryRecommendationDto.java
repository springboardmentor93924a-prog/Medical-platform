package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AiInventoryRecommendationDto {

    private Integer medicineId;
    private String medicineName;
    private String genericName;
    private String categoryName;
    private String strength;
    private String dosageForm;

    // Current Stock & Metrics
    private Integer currentStock;
    private Double averageDailyConsumption; // ADC (units/day)
    private Double weeklyConsumption;
    private Double monthlyConsumption;
    private Double daysOfCover;             // Estimated days of stock remaining
    private LocalDate projectedDepletionDate; // When stock hits 0

    // Reorder Calculations
    private Integer reorderPoint;           // ROP = (ADC * LeadTime) + SafetyStock
    private Integer safetyStock;            // Buffer stock
    private Integer leadTimeDays;           // Supplier delivery lead time
    private Integer recommendedOrderQuantity; // Suggested replenishment
    private Integer incomingOnOrderQuantity;  // In approved or in-transit POs
    private Integer targetMaxStock;         // Target inventory ceiling

    // Trend & AI Classification
    private String demandTrend;             // "INCREASING", "DECREASING", "STABLE"
    private Double trendPercentage;         // e.g. +24.5% vs prior period
    private String status;                  // "CRITICAL_SHORTAGE", "REORDER_RECOMMENDED", "ADEQUATE", "OVERSTOCKED", "SLOW_MOVING", "INSUFFICIENT_DATA"
    private Integer confidenceScore;        // 0 - 100%
    private String confidenceLevel;         // "HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"

    // Intelligence & Explanations
    private String explanation;             // Plain-language reason explaining why this was recommended
    private String seasonalInsight;         // Seasonal context (cold & flu, monsoon, allergy surges)
    private Boolean hasExpiringBatchRisk;   // Batch will expire before projected depletion
    private Integer expiringUnitsCount;     // Units at risk of expiration

    // Supplier & Cost
    private Integer primarySupplierId;
    private String primarySupplierName;
    private BigDecimal unitCost;
    private BigDecimal estimatedReorderCost;

    private LocalDateTime calculatedAt;

    public AiInventoryRecommendationDto() {
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

    public String getStrength() {
        return strength;
    }

    public void setStrength(String strength) {
        this.strength = strength;
    }

    public String getDosageForm() {
        return dosageForm;
    }

    public void setDosageForm(String dosageForm) {
        this.dosageForm = dosageForm;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public Double getAverageDailyConsumption() {
        return averageDailyConsumption;
    }

    public void setAverageDailyConsumption(Double averageDailyConsumption) {
        this.averageDailyConsumption = averageDailyConsumption;
    }

    public Double getWeeklyConsumption() {
        return weeklyConsumption;
    }

    public void setWeeklyConsumption(Double weeklyConsumption) {
        this.weeklyConsumption = weeklyConsumption;
    }

    public Double getMonthlyConsumption() {
        return monthlyConsumption;
    }

    public void setMonthlyConsumption(Double monthlyConsumption) {
        this.monthlyConsumption = monthlyConsumption;
    }

    public Double getDaysOfCover() {
        return daysOfCover;
    }

    public void setDaysOfCover(Double daysOfCover) {
        this.daysOfCover = daysOfCover;
    }

    public LocalDate getProjectedDepletionDate() {
        return projectedDepletionDate;
    }

    public void setProjectedDepletionDate(LocalDate projectedDepletionDate) {
        this.projectedDepletionDate = projectedDepletionDate;
    }

    public Integer getReorderPoint() {
        return reorderPoint;
    }

    public void setReorderPoint(Integer reorderPoint) {
        this.reorderPoint = reorderPoint;
    }

    public Integer getSafetyStock() {
        return safetyStock;
    }

    public void setSafetyStock(Integer safetyStock) {
        this.safetyStock = safetyStock;
    }

    public Integer getLeadTimeDays() {
        return leadTimeDays;
    }

    public void setLeadTimeDays(Integer leadTimeDays) {
        this.leadTimeDays = leadTimeDays;
    }

    public Integer getRecommendedOrderQuantity() {
        return recommendedOrderQuantity;
    }

    public void setRecommendedOrderQuantity(Integer recommendedOrderQuantity) {
        this.recommendedOrderQuantity = recommendedOrderQuantity;
    }

    public Integer getIncomingOnOrderQuantity() {
        return incomingOnOrderQuantity;
    }

    public void setIncomingOnOrderQuantity(Integer incomingOnOrderQuantity) {
        this.incomingOnOrderQuantity = incomingOnOrderQuantity;
    }

    public Integer getTargetMaxStock() {
        return targetMaxStock;
    }

    public void setTargetMaxStock(Integer targetMaxStock) {
        this.targetMaxStock = targetMaxStock;
    }

    public String getDemandTrend() {
        return demandTrend;
    }

    public void setDemandTrend(String demandTrend) {
        this.demandTrend = demandTrend;
    }

    public Double getTrendPercentage() {
        return trendPercentage;
    }

    public void setTrendPercentage(Double trendPercentage) {
        this.trendPercentage = trendPercentage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Integer confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(String confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getSeasonalInsight() {
        return seasonalInsight;
    }

    public void setSeasonalInsight(String seasonalInsight) {
        this.seasonalInsight = seasonalInsight;
    }

    public Boolean getHasExpiringBatchRisk() {
        return hasExpiringBatchRisk;
    }

    public void setHasExpiringBatchRisk(Boolean hasExpiringBatchRisk) {
        this.hasExpiringBatchRisk = hasExpiringBatchRisk;
    }

    public Integer getExpiringUnitsCount() {
        return expiringUnitsCount;
    }

    public void setExpiringUnitsCount(Integer expiringUnitsCount) {
        this.expiringUnitsCount = expiringUnitsCount;
    }

    public Integer getPrimarySupplierId() {
        return primarySupplierId;
    }

    public void setPrimarySupplierId(Integer primarySupplierId) {
        this.primarySupplierId = primarySupplierId;
    }

    public String getPrimarySupplierName() {
        return primarySupplierName;
    }

    public void setPrimarySupplierName(String primarySupplierName) {
        this.primarySupplierName = primarySupplierName;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getEstimatedReorderCost() {
        return estimatedReorderCost;
    }

    public void setEstimatedReorderCost(BigDecimal estimatedReorderCost) {
        this.estimatedReorderCost = estimatedReorderCost;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}

