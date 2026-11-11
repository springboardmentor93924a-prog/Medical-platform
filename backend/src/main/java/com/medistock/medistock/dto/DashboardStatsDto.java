package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardStatsDto {

    private long totalMedicines;
    private BigDecimal inventoryValue;
    private long purchaseOrdersCount;
    private long suppliersCount;
    private long lowStockCount;

    private StockStatusDto stockStatus;
    private ExpiringSoonDto expiringSoon;
    private List<RecentOrderDto> recentOrders;
    private List<TopMedicineDto> topMedicines;
    private long unreadNotificationsCount;

    public DashboardStatsDto() {
    }

    public long getTotalMedicines() {
        return totalMedicines;
    }

    public void setTotalMedicines(long totalMedicines) {
        this.totalMedicines = totalMedicines;
    }

    public BigDecimal getInventoryValue() {
        return inventoryValue;
    }

    public void setInventoryValue(BigDecimal inventoryValue) {
        this.inventoryValue = inventoryValue;
    }

    public long getPurchaseOrdersCount() {
        return purchaseOrdersCount;
    }

    public void setPurchaseOrdersCount(long purchaseOrdersCount) {
        this.purchaseOrdersCount = purchaseOrdersCount;
    }

    public long getSuppliersCount() {
        return suppliersCount;
    }

    public void setSuppliersCount(long suppliersCount) {
        this.suppliersCount = suppliersCount;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public StockStatusDto getStockStatus() {
        return stockStatus;
    }

    public void setStockStatus(StockStatusDto stockStatus) {
        this.stockStatus = stockStatus;
    }

    public ExpiringSoonDto getExpiringSoon() {
        return expiringSoon;
    }

    public void setExpiringSoon(ExpiringSoonDto expiringSoon) {
        this.expiringSoon = expiringSoon;
    }

    public List<RecentOrderDto> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<RecentOrderDto> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public List<TopMedicineDto> getTopMedicines() {
        return topMedicines;
    }

    public void setTopMedicines(List<TopMedicineDto> topMedicines) {
        this.topMedicines = topMedicines;
    }

    public long getUnreadNotificationsCount() {
        return unreadNotificationsCount;
    }

    public void setUnreadNotificationsCount(long unreadNotificationsCount) {
        this.unreadNotificationsCount = unreadNotificationsCount;
    }

    public static class StockStatusDto {
        private long inStock;
        private double inStockPercent;
        private long lowStock;
        private double lowStockPercent;
        private long outOfStock;
        private double outOfStockPercent;
        private String message;

        public StockStatusDto() {}

        public long getInStock() { return inStock; }
        public void setInStock(long inStock) { this.inStock = inStock; }
        public double getInStockPercent() { return inStockPercent; }
        public void setInStockPercent(double inStockPercent) { this.inStockPercent = inStockPercent; }
        public long getLowStock() { return lowStock; }
        public void setLowStock(long lowStock) { this.lowStock = lowStock; }
        public double getLowStockPercent() { return lowStockPercent; }
        public void setLowStockPercent(double lowStockPercent) { this.lowStockPercent = lowStockPercent; }
        public long getOutOfStock() { return outOfStock; }
        public void setOutOfStock(long outOfStock) { this.outOfStock = outOfStock; }
        public double getOutOfStockPercent() { return outOfStockPercent; }
        public void setOutOfStockPercent(double outOfStockPercent) { this.outOfStockPercent = outOfStockPercent; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class ExpiringSoonDto {
        private long nearExpiryCount;
        private long expiredCount;

        public ExpiringSoonDto() {}

        public long getNearExpiryCount() { return nearExpiryCount; }
        public void setNearExpiryCount(long nearExpiryCount) { this.nearExpiryCount = nearExpiryCount; }
        public long getExpiredCount() { return expiredCount; }
        public void setExpiredCount(long expiredCount) { this.expiredCount = expiredCount; }
    }

    public static class RecentOrderDto {
        private String poNumber;
        private String supplier;
        private String date;
        private BigDecimal amount;
        private String status;

        public RecentOrderDto() {}

        public RecentOrderDto(String poNumber, String supplier, String date, BigDecimal amount, String status) {
            this.poNumber = poNumber;
            this.supplier = supplier;
            this.date = date;
            this.amount = amount;
            this.status = status;
        }

        public String getPoNumber() { return poNumber; }
        public void setPoNumber(String poNumber) { this.poNumber = poNumber; }
        public String getSupplier() { return supplier; }
        public void setSupplier(String supplier) { this.supplier = supplier; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class TopMedicineDto {
        private int rank;
        private String medicineName;
        private long quantity;
        private String unit;

        public TopMedicineDto() {}

        public TopMedicineDto(int rank, String medicineName, long quantity, String unit) {
            this.rank = rank;
            this.medicineName = medicineName;
            this.quantity = quantity;
            this.unit = unit;
        }

        public int getRank() { return rank; }
        public void setRank(int rank) { this.rank = rank; }
        public String getMedicineName() { return medicineName; }
        public void setMedicineName(String medicineName) { this.medicineName = medicineName; }
        public long getQuantity() { return quantity; }
        public void setQuantity(long quantity) { this.quantity = quantity; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
    }
}
