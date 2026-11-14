package com.medistock.dto.backup;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SystemBackupSnapshot {
    private String appVersion = "1.0.0";
    private int snapshotVersion = 1;
    private LocalDateTime timestamp = LocalDateTime.now();
    private String createdBy;
    private int totalRecords;
    private String checksumSha256;

    private List<CategorySnapshot> categories = new ArrayList<>();
    private List<SupplierSnapshot> suppliers = new ArrayList<>();
    private List<UserSnapshot> users = new ArrayList<>();
    private List<MedicineSnapshot> medicines = new ArrayList<>();
    private List<PurchaseOrderSnapshot> purchaseOrders = new ArrayList<>();
    private List<StockMovementSnapshot> stockMovements = new ArrayList<>();
    private List<WastageReportSnapshot> wastageReports = new ArrayList<>();
    private List<FeedbackSnapshot> feedback = new ArrayList<>();
    private List<NotificationSnapshot> notifications = new ArrayList<>();
    private List<SystemSettingSnapshot> systemSettings = new ArrayList<>();

    public SystemBackupSnapshot() {}

    public String getAppVersion() { return appVersion; }
    public void setAppVersion(String appVersion) { this.appVersion = appVersion; }

    public int getSnapshotVersion() { return snapshotVersion; }
    public void setSnapshotVersion(int snapshotVersion) { this.snapshotVersion = snapshotVersion; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public String getChecksumSha256() { return checksumSha256; }
    public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }

    public List<CategorySnapshot> getCategories() { return categories; }
    public void setCategories(List<CategorySnapshot> categories) { this.categories = categories; }

    public List<SupplierSnapshot> getSuppliers() { return suppliers; }
    public void setSuppliers(List<SupplierSnapshot> suppliers) { this.suppliers = suppliers; }

    public List<UserSnapshot> getUsers() { return users; }
    public void setUsers(List<UserSnapshot> users) { this.users = users; }

    public List<MedicineSnapshot> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineSnapshot> medicines) { this.medicines = medicines; }

    public List<PurchaseOrderSnapshot> getPurchaseOrders() { return purchaseOrders; }
    public void setPurchaseOrders(List<PurchaseOrderSnapshot> purchaseOrders) { this.purchaseOrders = purchaseOrders; }

    public List<StockMovementSnapshot> getStockMovements() { return stockMovements; }
    public void setStockMovements(List<StockMovementSnapshot> stockMovements) { this.stockMovements = stockMovements; }

    public List<WastageReportSnapshot> getWastageReports() { return wastageReports; }
    public void setWastageReports(List<WastageReportSnapshot> wastageReports) { this.wastageReports = wastageReports; }

    public List<FeedbackSnapshot> getFeedback() { return feedback; }
    public void setFeedback(List<FeedbackSnapshot> feedback) { this.feedback = feedback; }

    public List<NotificationSnapshot> getNotifications() { return notifications; }
    public void setNotifications(List<NotificationSnapshot> notifications) { this.notifications = notifications; }

    public List<SystemSettingSnapshot> getSystemSettings() { return systemSettings; }
    public void setSystemSettings(List<SystemSettingSnapshot> systemSettings) { this.systemSettings = systemSettings; }
}
