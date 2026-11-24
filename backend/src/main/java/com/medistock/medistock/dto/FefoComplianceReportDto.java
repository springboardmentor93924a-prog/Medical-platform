package com.medistock.medistock.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FefoComplianceReportDto {

    private double complianceRate = 100.0;
    private long totalAllocations = 0;
    private long compliantAllocations = 0;
    private long overriddenAllocations = 0;
    private long totalUnitsAllocated = 0;
    private long nearExpiryUnitsSalvaged = 0;

    // Inventory batch totals
    private long totalBatches = 0;
    private long eligibleBatches = 0;
    private long nearExpiryBatches = 0; // <= 60 days
    private long expiredBatches = 0;

    // Expiry breakdown buckets (matching Image 5: Expiry Summary)
    // - Critical: <= 7 days
    // - Near Expiry: 8 to 30 days
    // - Moderate: 31 to 60 days
    // - Warning: 61 to 90 days
    // - Healthy: > 90 days (or > 6 months)
    // - Expired: < 0 days
    private Map<String, Long> expirySummary = new HashMap<>();

    // Compliance trend over time (for charts)
    private List<Map<String, Object>> complianceTrend = new ArrayList<>();

    // Breakdown of reasons given when FEFO was overridden
    private List<Map<String, Object>> overrideReasons = new ArrayList<>();

    // Recent items nearing expiry (for quick action)
    private List<FefoBatchDto> criticalExpiringBatches = new ArrayList<>();

    public FefoComplianceReportDto() {}

    public double getComplianceRate() {
        return complianceRate;
    }

    public void setComplianceRate(double complianceRate) {
        this.complianceRate = complianceRate;
    }

    public long getTotalAllocations() {
        return totalAllocations;
    }

    public void setTotalAllocations(long totalAllocations) {
        this.totalAllocations = totalAllocations;
    }

    public long getCompliantAllocations() {
        return compliantAllocations;
    }

    public void setCompliantAllocations(long compliantAllocations) {
        this.compliantAllocations = compliantAllocations;
    }

    public long getOverriddenAllocations() {
        return overriddenAllocations;
    }

    public void setOverriddenAllocations(long overriddenAllocations) {
        this.overriddenAllocations = overriddenAllocations;
    }

    public long getTotalUnitsAllocated() {
        return totalUnitsAllocated;
    }

    public void setTotalUnitsAllocated(long totalUnitsAllocated) {
        this.totalUnitsAllocated = totalUnitsAllocated;
    }

    public long getNearExpiryUnitsSalvaged() {
        return nearExpiryUnitsSalvaged;
    }

    public void setNearExpiryUnitsSalvaged(long nearExpiryUnitsSalvaged) {
        this.nearExpiryUnitsSalvaged = nearExpiryUnitsSalvaged;
    }

    public long getTotalBatches() {
        return totalBatches;
    }

    public void setTotalBatches(long totalBatches) {
        this.totalBatches = totalBatches;
    }

    public long getEligibleBatches() {
        return eligibleBatches;
    }

    public void setEligibleBatches(long eligibleBatches) {
        this.eligibleBatches = eligibleBatches;
    }

    public long getNearExpiryBatches() {
        return nearExpiryBatches;
    }

    public void setNearExpiryBatches(long nearExpiryBatches) {
        this.nearExpiryBatches = nearExpiryBatches;
    }

    public long getExpiredBatches() {
        return expiredBatches;
    }

    public void setExpiredBatches(long expiredBatches) {
        this.expiredBatches = expiredBatches;
    }

    public Map<String, Long> getExpirySummary() {
        return expirySummary;
    }

    public void setExpirySummary(Map<String, Long> expirySummary) {
        this.expirySummary = expirySummary;
    }

    public List<Map<String, Object>> getComplianceTrend() {
        return complianceTrend;
    }

    public void setComplianceTrend(List<Map<String, Object>> complianceTrend) {
        this.complianceTrend = complianceTrend;
    }

    public List<Map<String, Object>> getOverrideReasons() {
        return overrideReasons;
    }

    public void setOverrideReasons(List<Map<String, Object>> overrideReasons) {
        this.overrideReasons = overrideReasons;
    }

    public List<FefoBatchDto> getCriticalExpiringBatches() {
        return criticalExpiringBatches;
    }

    public void setCriticalExpiringBatches(List<FefoBatchDto> criticalExpiringBatches) {
        this.criticalExpiringBatches = criticalExpiringBatches;
    }
}

