
package com.medistock.dto;

import java.math.BigDecimal;
import java.util.List;

public class AiRecommendationResponse {

    private Summary summary;
    private List<LowStockItem> lowStockItems;
    private List<ReorderSuggestion> reorderSuggestions;
    private List<ExpiryRisk> expiryRisks;
    private List<DemandForecast> demandForecasts;
    private StockReport stockReport;

    public AiRecommendationResponse() {
    }

    public AiRecommendationResponse(
            Summary summary,
            List<LowStockItem> lowStockItems,
            List<ReorderSuggestion> reorderSuggestions,
            List<ExpiryRisk> expiryRisks,
            List<DemandForecast> demandForecasts,
            StockReport stockReport
    ) {
        this.summary = summary;
        this.lowStockItems = lowStockItems;
        this.reorderSuggestions = reorderSuggestions;
        this.expiryRisks = expiryRisks;
        this.demandForecasts = demandForecasts;
        this.stockReport = stockReport;
    }

    // Summary
    public static class Summary {

        private long totalMedicines;
        private long lowStockCount;
        private long expiringBatchCount;
        private long criticalExpiryCount;
        private long reorderCount;

        public Summary(
                long totalMedicines,
                long lowStockCount,
                long expiringBatchCount,
                long criticalExpiryCount,
                long reorderCount
        ) {
            this.totalMedicines = totalMedicines;
            this.lowStockCount = lowStockCount;
            this.expiringBatchCount = expiringBatchCount;
            this.criticalExpiryCount = criticalExpiryCount;
            this.reorderCount = reorderCount;
        }

        public long getTotalMedicines() {
            return totalMedicines;
        }

        public long getLowStockCount() {
            return lowStockCount;
        }

        public long getExpiringBatchCount() {
            return expiringBatchCount;
        }

        public long getCriticalExpiryCount() {
            return criticalExpiryCount;
        }

        public long getReorderCount() {
            return reorderCount;
        }
    }

    // Low Stock Items
    public static class LowStockItem {

        private Long medicineId;
        private String medicineName;
        private Integer availableStock;
        private Integer minimumStock;
        private String severity;

        public LowStockItem(
                Long medicineId,
                String medicineName,
                Integer availableStock,
                Integer minimumStock,
                String severity
        ) {
            this.medicineId = medicineId;
            this.medicineName = medicineName;
            this.availableStock = availableStock;
            this.minimumStock = minimumStock;
            this.severity = severity;
        }

        public Long getMedicineId() {
            return medicineId;
        }

        public String getMedicineName() {
            return medicineName;
        }

        public Integer getAvailableStock() {
            return availableStock;
        }

        public Integer getMinimumStock() {
            return minimumStock;
        }

        public String getSeverity() {
            return severity;
        }
    }

    // Reorder Suggestions
    public static class ReorderSuggestion {

        private Long medicineId;
        private String medicineName;
        private Integer currentStock;
        private Integer suggestedQuantity;

        // Nullable when a reliable cost cannot be calculated.
        private BigDecimal estimatedCost;

        private String reason;

        public ReorderSuggestion(
                Long medicineId,
                String medicineName,
                Integer currentStock,
                Integer suggestedQuantity,
                BigDecimal estimatedCost,
                String reason
        ) {
            this.medicineId = medicineId;
            this.medicineName = medicineName;
            this.currentStock = currentStock;
            this.suggestedQuantity = suggestedQuantity;
            this.estimatedCost = estimatedCost;
            this.reason = reason;
        }

        public Long getMedicineId() {
            return medicineId;
        }

        public String getMedicineName() {
            return medicineName;
        }

        public Integer getCurrentStock() {
            return currentStock;
        }

        public Integer getSuggestedQuantity() {
            return suggestedQuantity;
        }

        public BigDecimal getEstimatedCost() {
            return estimatedCost;
        }

        public String getReason() {
            return reason;
        }
    }

    // Expiry Risks
    public static class ExpiryRisk {

        private Long inventoryId;
        private String medicineName;
        private String batchNumber;
        private Integer remainingQuantity;
        private String expiryDate;
        private long daysUntilExpiry;
        private String riskLevel;

        public ExpiryRisk(
                Long inventoryId,
                String medicineName,
                String batchNumber,
                Integer remainingQuantity,
                String expiryDate,
                long daysUntilExpiry,
                String riskLevel
        ) {
            this.inventoryId = inventoryId;
            this.medicineName = medicineName;
            this.batchNumber = batchNumber;
            this.remainingQuantity = remainingQuantity;
            this.expiryDate = expiryDate;
            this.daysUntilExpiry = daysUntilExpiry;
            this.riskLevel = riskLevel;
        }

        public Long getInventoryId() {
            return inventoryId;
        }

        public String getMedicineName() {
            return medicineName;
        }

        public String getBatchNumber() {
            return batchNumber;
        }

        public Integer getRemainingQuantity() {
            return remainingQuantity;
        }

        public String getExpiryDate() {
            return expiryDate;
        }

        public long getDaysUntilExpiry() {
            return daysUntilExpiry;
        }

        public String getRiskLevel() {
            return riskLevel;
        }
    }

    // Demand Forecasts
    public static class DemandForecast {

        private Long medicineId;
        private String medicineName;
        private Integer currentStock;
        private Double averageDailyDemand;
        private Integer predictedSevenDayDemand;
        private String recommendation;

        public DemandForecast(
                Long medicineId,
                String medicineName,
                Integer currentStock,
                Double averageDailyDemand,
                Integer predictedSevenDayDemand,
                String recommendation
        ) {
            this.medicineId = medicineId;
            this.medicineName = medicineName;
            this.currentStock = currentStock;
            this.averageDailyDemand = averageDailyDemand;
            this.predictedSevenDayDemand = predictedSevenDayDemand;
            this.recommendation = recommendation;
        }

        public Long getMedicineId() {
            return medicineId;
        }

        public String getMedicineName() {
            return medicineName;
        }

        public Integer getCurrentStock() {
            return currentStock;
        }

        public Double getAverageDailyDemand() {
            return averageDailyDemand;
        }

        public Integer getPredictedSevenDayDemand() {
            return predictedSevenDayDemand;
        }

        public String getRecommendation() {
            return recommendation;
        }
    }

    // Stock Report
    public static class StockReport {

        private String generatedAt;
        private String overallStatus;
        private List<String> insights;

        public StockReport(
                String generatedAt,
                String overallStatus,
                List<String> insights
        ) {
            this.generatedAt = generatedAt;
            this.overallStatus = overallStatus;
            this.insights = insights;
        }

        public String getGeneratedAt() {
            return generatedAt;
        }

        public String getOverallStatus() {
            return overallStatus;
        }

        public List<String> getInsights() {
            return insights;
        }
    }

    // Main Response Getters and Setters

    public Summary getSummary() {
        return summary;
    }

    public void setSummary(Summary summary) {
        this.summary = summary;
    }

    public List<LowStockItem> getLowStockItems() {
        return lowStockItems;
    }

    public void setLowStockItems(List<LowStockItem> items) {
        this.lowStockItems = items;
    }

    public List<ReorderSuggestion> getReorderSuggestions() {
        return reorderSuggestions;
    }

    public void setReorderSuggestions(List<ReorderSuggestion> items) {
        this.reorderSuggestions = items;
    }

    public List<ExpiryRisk> getExpiryRisks() {
        return expiryRisks;
    }

    public void setExpiryRisks(List<ExpiryRisk> items) {
        this.expiryRisks = items;
    }

    public List<DemandForecast> getDemandForecasts() {
        return demandForecasts;
    }

    public void setDemandForecasts(List<DemandForecast> items) {
        this.demandForecasts = items;
    }

    public StockReport getStockReport() {
        return stockReport;
    }

    public void setStockReport(StockReport stockReport) {
        this.stockReport = stockReport;
    }
}
