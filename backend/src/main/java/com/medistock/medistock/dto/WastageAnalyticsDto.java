package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class WastageAnalyticsDto {

    private long totalRecords;
    private long pendingApprovals;
    private long totalWastedUnits;
    private BigDecimal totalWastageCost;
    private BigDecimal totalExpiredLoss;
    private BigDecimal totalDamagedLoss;
    private BigDecimal supplierRecovery;
    private BigDecimal netFinancialLoss;
    private Map<String, Long> countByReason;
    private Map<String, BigDecimal> lossByReason;
    private List<Map<String, Object>> monthlyLossTrend;
    private List<Map<String, Object>> topWastedMedicines;
    private List<Map<String, Object>> topWastedSuppliers;
    private List<Map<String, Object>> aiPredictions;

    public WastageAnalyticsDto() {}

    public long getTotalRecords() { return totalRecords; }
    public void setTotalRecords(long totalRecords) { this.totalRecords = totalRecords; }

    public long getPendingApprovals() { return pendingApprovals; }
    public void setPendingApprovals(long pendingApprovals) { this.pendingApprovals = pendingApprovals; }

    public long getTotalWastedUnits() { return totalWastedUnits; }
    public void setTotalWastedUnits(long totalWastedUnits) { this.totalWastedUnits = totalWastedUnits; }

    public BigDecimal getTotalWastageCost() { return totalWastageCost; }
    public void setTotalWastageCost(BigDecimal totalWastageCost) { this.totalWastageCost = totalWastageCost; }

    public BigDecimal getTotalExpiredLoss() { return totalExpiredLoss; }
    public void setTotalExpiredLoss(BigDecimal totalExpiredLoss) { this.totalExpiredLoss = totalExpiredLoss; }

    public BigDecimal getTotalDamagedLoss() { return totalDamagedLoss; }
    public void setTotalDamagedLoss(BigDecimal totalDamagedLoss) { this.totalDamagedLoss = totalDamagedLoss; }

    public BigDecimal getSupplierRecovery() { return supplierRecovery; }
    public void setSupplierRecovery(BigDecimal supplierRecovery) { this.supplierRecovery = supplierRecovery; }

    public BigDecimal getNetFinancialLoss() { return netFinancialLoss; }
    public void setNetFinancialLoss(BigDecimal netFinancialLoss) { this.netFinancialLoss = netFinancialLoss; }

    public Map<String, Long> getCountByReason() { return countByReason; }
    public void setCountByReason(Map<String, Long> countByReason) { this.countByReason = countByReason; }

    public Map<String, BigDecimal> getLossByReason() { return lossByReason; }
    public void setLossByReason(Map<String, BigDecimal> lossByReason) { this.lossByReason = lossByReason; }

    public List<Map<String, Object>> getMonthlyLossTrend() { return monthlyLossTrend; }
    public void setMonthlyLossTrend(List<Map<String, Object>> monthlyLossTrend) { this.monthlyLossTrend = monthlyLossTrend; }

    public List<Map<String, Object>> getTopWastedMedicines() { return topWastedMedicines; }
    public void setTopWastedMedicines(List<Map<String, Object>> topWastedMedicines) { this.topWastedMedicines = topWastedMedicines; }

    public List<Map<String, Object>> getTopWastedSuppliers() { return topWastedSuppliers; }
    public void setTopWastedSuppliers(List<Map<String, Object>> topWastedSuppliers) { this.topWastedSuppliers = topWastedSuppliers; }

    public List<Map<String, Object>> getAiPredictions() { return aiPredictions; }
    public void setAiPredictions(List<Map<String, Object>> aiPredictions) { this.aiPredictions = aiPredictions; }
}

