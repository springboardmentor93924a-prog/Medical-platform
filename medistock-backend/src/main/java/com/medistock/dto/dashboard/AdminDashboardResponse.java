package com.medistock.dto.dashboard;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminDashboardResponse(
        Summary summary,
        List<LowStockItem> lowStock,
        List<ExpiringBatch> expiring,
        List<CategoryStock> stockByCategory,
        List<SupplierOnTime> suppliers,
        List<ActivityItem> recentActivity
) {

    public record Summary(
            long totalUsers,
            long totalMedicines,
            long totalCategories,
            long lowStockCount,
            long expiringCount,
            long totalUnits,
            BigDecimal inventoryValue) {
    }

    public record LowStockItem(
            long medicineId,
            String name,
            long quantity,
            int reorderLevel) {
    }

    public record ExpiringBatch(
            long batchId,
            String medicineName,
            String batchNumber,
            LocalDate expiryDate,
            int quantity,
            int daysLeft) {
    }

    public record CategoryStock(
            String category,
            long quantity) {
    }

    public record SupplierOnTime(
            String name,
            long totalOrders,
            BigDecimal onTimePercent) {
    }

    public record ActivityItem(
            long id,
            String movementType,
            int quantityChange,
            String medicineName,
            String performedBy,
            String reason,
            Instant createdAt) {
    }
}