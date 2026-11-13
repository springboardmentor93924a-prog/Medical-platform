package com.medistock.backend.dto;

import java.time.LocalDate;
import java.util.List;

public final class RecommendationDtos {
    private RecommendationDtos() {}

    /** priority: High or Medium. dailyUsage is 0 when there is no usage history yet. */
    public record ReorderItem(Long medicineId, String medicine, Long supplierId, String supplier, long usable, long onOrder,
                              double dailyUsage, Long daysLeft, int leadDays, long suggestedQty, String priority, String reason) {}

    public record ExpiryRisk(Long batchId, String medicine, String batchNumber, int quantity, LocalDate expiryDate,
                             long daysToExpiry, long atRiskUnits, long atRiskValue, String advice) {}

    public record SlowMover(String medicine, long usable, long valueTiedUp) {}

    public record RecommendationResponse(String basis, List<ReorderItem> reorders, List<ExpiryRisk> expiryRisks, List<SlowMover> slowMovers) {}
}
