package com.medistock.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {
    // Inventory metrics
    private long totalMedicines;
    private long totalStockQuantity;
    private long lowStockCount;
    private long outOfStockCount;
    private long nearExpiryCount;
    private long expiredCount;

    // Supplier metrics
    private long totalSuppliers;
    private long pendingSuppliers;
    private long approvedSuppliers;

    // Purchase Order metrics
    private long totalPurchaseOrders;
    private long pendingOrders;
    private long shippedOrders;
    private long completedOrders;
    private BigDecimal totalPurchasesAmount = BigDecimal.ZERO;

    // User metrics (Admin)
    private long totalUsers;
    private long totalPharmacists;
    private long totalStaff;
    private long totalSupplierUsers;

    // Supplier-specific metrics (for logged in supplier)
    private Long supplierId;
    private String supplierCompanyName;
    private long mySuppliedMedicines;
    private long myActiveOrders;
    private long myPendingAcceptanceOrders;
    private long myCompletedOrders;
    private BigDecimal myTotalOrderValue = BigDecimal.ZERO;

    // Analytics lists & charts
    private List<?> recentMovements;
    private List<?> recentOrders;
    private List<Map<String, Object>> stockByCategory;

    public DashboardStatsResponse() {
    }

    public long getTotalMedicines() {
        return totalMedicines;
    }

    public void setTotalMedicines(long totalMedicines) {
        this.totalMedicines = totalMedicines;
    }

    public long getTotalStockQuantity() {
        return totalStockQuantity;
    }

    public void setTotalStockQuantity(long totalStockQuantity) {
        this.totalStockQuantity = totalStockQuantity;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getOutOfStockCount() {
        return outOfStockCount;
    }

    public void setOutOfStockCount(long outOfStockCount) {
        this.outOfStockCount = outOfStockCount;
    }

    public long getNearExpiryCount() {
        return nearExpiryCount;
    }

    public void setNearExpiryCount(long nearExpiryCount) {
        this.nearExpiryCount = nearExpiryCount;
    }

    public long getExpiredCount() {
        return expiredCount;
    }

    public void setExpiredCount(long expiredCount) {
        this.expiredCount = expiredCount;
    }

    public long getTotalSuppliers() {
        return totalSuppliers;
    }

    public void setTotalSuppliers(long totalSuppliers) {
        this.totalSuppliers = totalSuppliers;
    }

    public long getPendingSuppliers() {
        return pendingSuppliers;
    }

    public void setPendingSuppliers(long pendingSuppliers) {
        this.pendingSuppliers = pendingSuppliers;
    }

    public long getApprovedSuppliers() {
        return approvedSuppliers;
    }

    public void setApprovedSuppliers(long approvedSuppliers) {
        this.approvedSuppliers = approvedSuppliers;
    }

    public long getTotalPurchaseOrders() {
        return totalPurchaseOrders;
    }

    public void setTotalPurchaseOrders(long totalPurchaseOrders) {
        this.totalPurchaseOrders = totalPurchaseOrders;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getShippedOrders() {
        return shippedOrders;
    }

    public void setShippedOrders(long shippedOrders) {
        this.shippedOrders = shippedOrders;
    }

    public long getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(long completedOrders) {
        this.completedOrders = completedOrders;
    }

    public BigDecimal getTotalPurchasesAmount() {
        return totalPurchasesAmount;
    }

    public void setTotalPurchasesAmount(BigDecimal totalPurchasesAmount) {
        this.totalPurchasesAmount = totalPurchasesAmount;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalPharmacists() {
        return totalPharmacists;
    }

    public void setTotalPharmacists(long totalPharmacists) {
        this.totalPharmacists = totalPharmacists;
    }

    public long getTotalStaff() {
        return totalStaff;
    }

    public void setTotalStaff(long totalStaff) {
        this.totalStaff = totalStaff;
    }

    public long getTotalSupplierUsers() {
        return totalSupplierUsers;
    }

    public void setTotalSupplierUsers(long totalSupplierUsers) {
        this.totalSupplierUsers = totalSupplierUsers;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierCompanyName() {
        return supplierCompanyName;
    }

    public void setSupplierCompanyName(String supplierCompanyName) {
        this.supplierCompanyName = supplierCompanyName;
    }

    public long getMySuppliedMedicines() {
        return mySuppliedMedicines;
    }

    public void setMySuppliedMedicines(long mySuppliedMedicines) {
        this.mySuppliedMedicines = mySuppliedMedicines;
    }

    public long getMyActiveOrders() {
        return myActiveOrders;
    }

    public void setMyActiveOrders(long myActiveOrders) {
        this.myActiveOrders = myActiveOrders;
    }

    public long getMyPendingAcceptanceOrders() {
        return myPendingAcceptanceOrders;
    }

    public void setMyPendingAcceptanceOrders(long myPendingAcceptanceOrders) {
        this.myPendingAcceptanceOrders = myPendingAcceptanceOrders;
    }

    public long getMyCompletedOrders() {
        return myCompletedOrders;
    }

    public void setMyCompletedOrders(long myCompletedOrders) {
        this.myCompletedOrders = myCompletedOrders;
    }

    public BigDecimal getMyTotalOrderValue() {
        return myTotalOrderValue;
    }

    public void setMyTotalOrderValue(BigDecimal myTotalOrderValue) {
        this.myTotalOrderValue = myTotalOrderValue;
    }

    public List<?> getRecentMovements() {
        return recentMovements;
    }

    public void setRecentMovements(List<?> recentMovements) {
        this.recentMovements = recentMovements;
    }

    public List<?> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<?> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public List<Map<String, Object>> getStockByCategory() {
        return stockByCategory;
    }

    public void setStockByCategory(List<Map<String, Object>> stockByCategory) {
        this.stockByCategory = stockByCategory;
    }
}
