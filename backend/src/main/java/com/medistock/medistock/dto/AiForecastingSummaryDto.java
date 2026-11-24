package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public class AiForecastingSummaryDto {

    private long totalRecommendations;
    private long criticalShortagesCount;
    private long reorderRecommendedCount;
    private long overstockedCount;
    private long slowMovingCount;
    private long adequateCount;
    private long insufficientDataCount;

    private double overallAccuracy;          // e.g. 94.2%
    private double averageConfidence;        // e.g. 91.5%
    private int totalRecommendedReplenishmentUnits;
    private BigDecimal totalEstimatedReplenishmentCost;
    private LocalDateTime lastForecastUpdate;

    private Map<String, Long> categoryBreakdown;

    public AiForecastingSummaryDto() {
    }

    public long getTotalRecommendations() {
        return totalRecommendations;
    }

    public void setTotalRecommendations(long totalRecommendations) {
        this.totalRecommendations = totalRecommendations;
    }

    public long getCriticalShortagesCount() {
        return criticalShortagesCount;
    }

    public void setCriticalShortagesCount(long criticalShortagesCount) {
        this.criticalShortagesCount = criticalShortagesCount;
    }

    public long getReorderRecommendedCount() {
        return reorderRecommendedCount;
    }

    public void setReorderRecommendedCount(long reorderRecommendedCount) {
        this.reorderRecommendedCount = reorderRecommendedCount;
    }

    public long getOverstockedCount() {
        return overstockedCount;
    }

    public void setOverstockedCount(long overstockedCount) {
        this.overstockedCount = overstockedCount;
    }

    public long getSlowMovingCount() {
        return slowMovingCount;
    }

    public void setSlowMovingCount(long slowMovingCount) {
        this.slowMovingCount = slowMovingCount;
    }

    public long getAdequateCount() {
        return adequateCount;
    }

    public void setAdequateCount(long adequateCount) {
        this.adequateCount = adequateCount;
    }

    public long getInsufficientDataCount() {
        return insufficientDataCount;
    }

    public void setInsufficientDataCount(long insufficientDataCount) {
        this.insufficientDataCount = insufficientDataCount;
    }

    public double getOverallAccuracy() {
        return overallAccuracy;
    }

    public void setOverallAccuracy(double overallAccuracy) {
        this.overallAccuracy = overallAccuracy;
    }

    public double getAverageConfidence() {
        return averageConfidence;
    }

    public void setAverageConfidence(double averageConfidence) {
        this.averageConfidence = averageConfidence;
    }

    public int getTotalRecommendedReplenishmentUnits() {
        return totalRecommendedReplenishmentUnits;
    }

    public void setTotalRecommendedReplenishmentUnits(int totalRecommendedReplenishmentUnits) {
        this.totalRecommendedReplenishmentUnits = totalRecommendedReplenishmentUnits;
    }

    public BigDecimal getTotalEstimatedReplenishmentCost() {
        return totalEstimatedReplenishmentCost;
    }

    public void setTotalEstimatedReplenishmentCost(BigDecimal totalEstimatedReplenishmentCost) {
        this.totalEstimatedReplenishmentCost = totalEstimatedReplenishmentCost;
    }

    public LocalDateTime getLastForecastUpdate() {
        return lastForecastUpdate;
    }

    public void setLastForecastUpdate(LocalDateTime lastForecastUpdate) {
        this.lastForecastUpdate = lastForecastUpdate;
    }

    public Map<String, Long> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(Map<String, Long> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }
}

