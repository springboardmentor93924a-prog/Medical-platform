package com.medistock.medistock.dto;

import java.util.List;

public class DemandForecastChartDto {

    private Integer medicineId;
    private String medicineName;
    private String genericName;
    private String categoryName;
    private Integer currentStock;
    private Double daysOfCover;
    private Integer recommendedStockLevel;
    private Integer forecastAccuracy;      // Percentage (e.g. 93%)
    private Integer confidenceScore;       // Percentage (e.g. 92%)
    private Double averageDailyDemand;     // Units/day
    private String trend;                  // "INCREASING", "DECREASING", "STABLE"
    private Double trendPercentage;
    private String primaryInsight;
    private Integer recommendedReorderQty;
    private Integer projectedStockoutDays;
    private List<AiDemandForecastPointDto> points;

    public DemandForecastChartDto() {
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

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public Double getDaysOfCover() {
        return daysOfCover;
    }

    public void setDaysOfCover(Double daysOfCover) {
        this.daysOfCover = daysOfCover;
    }

    public Integer getRecommendedStockLevel() {
        return recommendedStockLevel;
    }

    public void setRecommendedStockLevel(Integer recommendedStockLevel) {
        this.recommendedStockLevel = recommendedStockLevel;
    }

    public Integer getForecastAccuracy() {
        return forecastAccuracy;
    }

    public void setForecastAccuracy(Integer forecastAccuracy) {
        this.forecastAccuracy = forecastAccuracy;
    }

    public Integer getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Integer confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public Double getAverageDailyDemand() {
        return averageDailyDemand;
    }

    public void setAverageDailyDemand(Double averageDailyDemand) {
        this.averageDailyDemand = averageDailyDemand;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public Double getTrendPercentage() {
        return trendPercentage;
    }

    public void setTrendPercentage(Double trendPercentage) {
        this.trendPercentage = trendPercentage;
    }

    public String getPrimaryInsight() {
        return primaryInsight;
    }

    public void setPrimaryInsight(String primaryInsight) {
        this.primaryInsight = primaryInsight;
    }

    public Integer getRecommendedReorderQty() {
        return recommendedReorderQty;
    }

    public void setRecommendedReorderQty(Integer recommendedReorderQty) {
        this.recommendedReorderQty = recommendedReorderQty;
    }

    public Integer getProjectedStockoutDays() {
        return projectedStockoutDays;
    }

    public void setProjectedStockoutDays(Integer projectedStockoutDays) {
        this.projectedStockoutDays = projectedStockoutDays;
    }

    public List<AiDemandForecastPointDto> getPoints() {
        return points;
    }

    public void setPoints(List<AiDemandForecastPointDto> points) {
        this.points = points;
    }
}

