package com.medistock.backend.dto;

import com.medistock.backend.dto.AlertDtos.AlertResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record LabelValue(String label, long value) {}
    public record SupplierStat(String name, long ordersPlaced, long ordersReceived, Integer onTimePercent) {}
    public record ActivityItem(String text, String by, Instant time) {}
    public record SuppliedMedicine(String name, int quantity) {}

    /**
     * One response shape for every role. Sections a role should not see are null.
     * Staff: stats, lowStock, expiring
     * Pharmacist: + stockByCategory, orderStatus, suppliers
     * Admin: + activity (and users in stats)
     * Supplier: stats and orderStatus for its own orders, plus supplied
     */
    public record DashboardResponse(
        String role,
        Map<String, Number> stats,
        List<AlertResponse> lowStock,
        List<AlertResponse> expiring,
        List<LabelValue> stockByCategory,
        Map<String, Long> orderStatus,
        List<SupplierStat> suppliers,
        List<ActivityItem> activity,
        List<SuppliedMedicine> supplied,
        List<LabelValue> stockStatus,        // chart: medicines by stock status
        List<LabelValue> expiryBuckets,      // chart: batches by time left
        List<LabelValue> monthlyPurchases) {}  // chart: order value per month, in rupees
}
