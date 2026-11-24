package com.medistock.medistock.dto.returns;

import java.math.BigDecimal;
import java.util.Map;

public class ReturnAnalyticsDto {
    private long totalReturns;
    private long quarantinedCount;
    private long underInspectionCount;
    private long restockedCount;
    private long supplierReturnsCount;
    private long wastageDisposedCount;
    private BigDecimal totalReturnValue;
    private Map<String, Long> countByStatus;
    private Map<String, Long> countByReason;

    public ReturnAnalyticsDto() {}

    public long getTotalReturns() {
        return totalReturns;
    }

    public void setTotalReturns(long totalReturns) {
        this.totalReturns = totalReturns;
    }

    public long getQuarantinedCount() {
        return quarantinedCount;
    }

    public void setQuarantinedCount(long quarantinedCount) {
        this.quarantinedCount = quarantinedCount;
    }

    public long getUnderInspectionCount() {
        return underInspectionCount;
    }

    public void setUnderInspectionCount(long underInspectionCount) {
        this.underInspectionCount = underInspectionCount;
    }

    public long getRestockedCount() {
        return restockedCount;
    }

    public void setRestockedCount(long restockedCount) {
        this.restockedCount = restockedCount;
    }

    public long getSupplierReturnsCount() {
        return supplierReturnsCount;
    }

    public void setSupplierReturnsCount(long supplierReturnsCount) {
        this.supplierReturnsCount = supplierReturnsCount;
    }

    public long getWastageDisposedCount() {
        return wastageDisposedCount;
    }

    public void setWastageDisposedCount(long wastageDisposedCount) {
        this.wastageDisposedCount = wastageDisposedCount;
    }

    public BigDecimal getTotalReturnValue() {
        return totalReturnValue;
    }

    public void setTotalReturnValue(BigDecimal totalReturnValue) {
        this.totalReturnValue = totalReturnValue;
    }

    public Map<String, Long> getCountByStatus() {
        return countByStatus;
    }

    public void setCountByStatus(Map<String, Long> countByStatus) {
        this.countByStatus = countByStatus;
    }

    public Map<String, Long> getCountByReason() {
        return countByReason;
    }

    public void setCountByReason(Map<String, Long> countByReason) {
        this.countByReason = countByReason;
    }
}

