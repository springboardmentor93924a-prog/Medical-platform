
package com.medistock.service;

import com.medistock.dto.AiRecommendationResponse;
import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.StockLog;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.StockLogRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AiRecommendationService {

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final StockLogRepository stockLogRepository;

    private static final int FORECAST_DAYS = 7;
    private static final int HISTORY_DAYS = 30;
    private static final int REORDER_TARGET_DAYS = 14;
    private static final int EXPIRY_WARNING_DAYS = 90;

    public AiRecommendationService(
            InventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            StockLogRepository stockLogRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.stockLogRepository = stockLogRepository;
    }

    // =========================================================
    // MAIN METHOD
    // =========================================================

    public AiRecommendationResponse getRecommendations() {

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime historyStart = now.minusDays(HISTORY_DAYS);

        // Load existing database records
        List<Medicine> medicines = medicineRepository.findAll();
        List<Inventory> inventories = inventoryRepository.findAll();

        List<StockLog> outgoingMovements =
                stockLogRepository.findOutgoingMovementsSince(historyStart);

        // Medicine lookup
        Map<Long, Medicine> medicineMap = medicines.stream()
                .collect(Collectors.toMap(
                        Medicine::getMedicineId,
                        medicine -> medicine,
                        (first, second) -> first
                ));

        // Group inventory batches by medicine
        Map<Long, List<Inventory>> inventoryByMedicine =
                inventories.stream().collect(Collectors.groupingBy(
                        Inventory::getMedicineId
                ));

        // Inventory batch ID -> Medicine ID
        Map<Long, Long> inventoryMedicineMap = new HashMap<>();

        for (Inventory inventory : inventories) {
            inventoryMedicineMap.put(
                    inventory.getInventoryId(),
                    inventory.getMedicineId()
            );
        }

        // =====================================================
        // PREPARE MEDICINE STOCK INFORMATION
        // =====================================================

        Map<Long, MedicineStock> stockMap = new HashMap<>();

        for (Medicine medicine : medicines) {

            MedicineStock stock = new MedicineStock();

            List<Inventory> batches = inventoryByMedicine.getOrDefault(
                    medicine.getMedicineId(),
                    new ArrayList<>()
            );

            for (Inventory batch : batches) {

                int quantity = safeInt(batch.getQuantity());

                // Minimum stock threshold
                if (batch.getMinimumStock() != null) {
                    stock.minimumStock = Math.max(
                            stock.minimumStock,
                            batch.getMinimumStock()
                    );
                }

                // Expired batches must not count as usable stock
                boolean notExpired = batch.getExpiryDate() == null
                        || !batch.getExpiryDate().isBefore(today);

                if (!notExpired || quantity <= 0) {
                    continue;
                }

                // Aggregate usable stock by medicine
                stock.currentStock += quantity;

                // Calculate available inventory value
                if (batch.getUnitPrice() != null
                        && batch.getUnitPrice().compareTo(BigDecimal.ZERO) >= 0) {

                    stock.totalStockValue =
                            stock.totalStockValue.add(
                                    batch.getUnitPrice().multiply(
                                            BigDecimal.valueOf(quantity)
                                    )
                            );

                    stock.pricedQuantity += quantity;
                }
            }

            stockMap.put(medicine.getMedicineId(), stock);
        }

        // =====================================================
        // CALCULATE OUTGOING STOCK DEMAND
        // =====================================================

        for (StockLog movement : outgoingMovements) {

            Long medicineId = inventoryMedicineMap.get(
                    movement.getInventoryId()
            );

            if (medicineId == null
                    || movement.getChangeQuantity() == null) {
                continue;
            }

            MedicineStock stock = stockMap.get(medicineId);

            if (stock == null) {
                continue;
            }

            // OUT movements are counted as positive demand
            stock.totalDemand += Math.abs(
                    (long) movement.getChangeQuantity()
            );
        }

        // =====================================================
        // BUILD ALL FIVE FEATURES
        // =====================================================

        // 1. Low-stock detection
        List<AiRecommendationResponse.LowStockItem> lowStockItems =
                buildLowStockItems(medicines, stockMap);

        // 2. Expiry-risk recommendations
        List<AiRecommendationResponse.ExpiryRisk> expiryRisks =
                buildExpiryRisks(inventories, medicineMap, today);

        // 3. Demand forecasting
        List<AiRecommendationResponse.DemandForecast> demandForecasts =
                buildDemandForecasts(medicines, stockMap);

        // 4. Smart reorder suggestions
        List<AiRecommendationResponse.ReorderSuggestion> reorderSuggestions =
                buildReorderSuggestions(medicines, stockMap);

        // =====================================================
        // SUMMARY
        // =====================================================

        AiRecommendationResponse.Summary summary =
                new AiRecommendationResponse.Summary(
                        medicines.size(),
                        lowStockItems.size(),
                        expiryRisks.size(),
                        countCriticalExpiry(expiryRisks),
                        reorderSuggestions.size()
                );

        // =====================================================
        // STOCK REPORT
        // =====================================================

        AiRecommendationResponse.StockReport stockReport =
                buildStockReport(
                        medicines,
                        lowStockItems,
                        expiryRisks,
                        reorderSuggestions,
                        demandForecasts,
                        now
                );

        return new AiRecommendationResponse(
                summary,
                lowStockItems,
                reorderSuggestions,
                expiryRisks,
                demandForecasts,
                stockReport
        );
    }

    // =========================================================
    // 1. LOW STOCK DETECTION
    // =========================================================

    private List<AiRecommendationResponse.LowStockItem> buildLowStockItems(
            List<Medicine> medicines,
            Map<Long, MedicineStock> stockMap
    ) {

        List<AiRecommendationResponse.LowStockItem> result =
                new ArrayList<>();

        for (Medicine medicine : medicines) {

            MedicineStock stock = stockMap.getOrDefault(
                    medicine.getMedicineId(),
                    new MedicineStock()
            );

            int availableStock = stock.currentStock;
            int minimumStock = stock.minimumStock;

            // Skip medicines with sufficient stock
            if (availableStock > minimumStock) {
                continue;
            }

            String severity;

            if (availableStock == 0) {
                severity = "CRITICAL";
            } else if (availableStock <= minimumStock / 2.0) {
                severity = "HIGH";
            } else {
                severity = "LOW";
            }

            result.add(
                    new AiRecommendationResponse.LowStockItem(
                            medicine.getMedicineId(),
                            medicine.getMedicineName(),
                            availableStock,
                            minimumStock,
                            severity
                    )
            );
        }

        result.sort(Comparator.comparingInt(
                AiRecommendationResponse.LowStockItem::getAvailableStock
        ));

        return result;
    }

    // =========================================================
    // 2. EXPIRY RISK RECOMMENDATIONS
    // =========================================================

    private List<AiRecommendationResponse.ExpiryRisk> buildExpiryRisks(
            List<Inventory> inventories,
            Map<Long, Medicine> medicineMap,
            LocalDate today
    ) {

        List<AiRecommendationResponse.ExpiryRisk> result =
                new ArrayList<>();

        for (Inventory inventory : inventories) {

            if (inventory.getExpiryDate() == null) {
                continue;
            }

            int quantity = safeInt(inventory.getQuantity());

            if (quantity <= 0) {
                continue;
            }

            long daysUntilExpiry = ChronoUnit.DAYS.between(
                    today,
                    inventory.getExpiryDate()
            );

            // Ignore batches expiring after the warning period
            if (daysUntilExpiry > EXPIRY_WARNING_DAYS) {
                continue;
            }

            String riskLevel;

            if (daysUntilExpiry < 0) {
                riskLevel = "EXPIRED";
            } else if (daysUntilExpiry <= 30) {
                riskLevel = "CRITICAL";
            } else if (daysUntilExpiry <= 60) {
                riskLevel = "HIGH";
            } else {
                riskLevel = "MEDIUM";
            }

            Medicine medicine = medicineMap.get(
                    inventory.getMedicineId()
            );

            String medicineName = medicine != null
                    ? medicine.getMedicineName()
                    : "Unknown Medicine";

            result.add(
                    new AiRecommendationResponse.ExpiryRisk(
                            inventory.getInventoryId(),
                            medicineName,
                            inventory.getBatchNumber(),
                            quantity,
                            inventory.getExpiryDate().toString(),
                            daysUntilExpiry,
                            riskLevel
                    )
            );
        }

        result.sort(Comparator.comparingLong(
                AiRecommendationResponse.ExpiryRisk::getDaysUntilExpiry
        ));

        return result;
    }

    // =========================================================
    // 3. DEMAND FORECASTING
    // =========================================================

    private List<AiRecommendationResponse.DemandForecast> buildDemandForecasts(
            List<Medicine> medicines,
            Map<Long, MedicineStock> stockMap
    ) {

        List<AiRecommendationResponse.DemandForecast> result =
                new ArrayList<>();

        for (Medicine medicine : medicines) {

            MedicineStock stock = stockMap.getOrDefault(
                    medicine.getMedicineId(),
                    new MedicineStock()
            );

            double averageDailyDemand =
                    stock.totalDemand / (double) HISTORY_DAYS;

            int predictedDemand = (int) Math.ceil(
                    averageDailyDemand * FORECAST_DAYS
            );

            String recommendation;

            if (stock.totalDemand == 0) {

                recommendation = "No outgoing stock recorded in the last "
                        + HISTORY_DAYS
                        + " days. Monitor demand.";

            } else if (stock.currentStock < predictedDemand) {

                recommendation = "Stock may be insufficient for the next "
                        + FORECAST_DAYS
                        + " days. Consider reordering.";

            } else {

                recommendation = "Current stock appears sufficient for the "
                        + "next " + FORECAST_DAYS + " days.";
            }

            result.add(
                    new AiRecommendationResponse.DemandForecast(
                            medicine.getMedicineId(),
                            medicine.getMedicineName(),
                            stock.currentStock,
                            roundTwoDecimals(averageDailyDemand),
                            predictedDemand,
                            recommendation
                    )
            );
        }

        result.sort(Comparator.comparingInt(
                AiRecommendationResponse.DemandForecast
                        ::getPredictedSevenDayDemand
        ).reversed());

        return result;
    }

    // =========================================================
    // 4. SMART REORDER SUGGESTIONS
    // =========================================================

    private List<AiRecommendationResponse.ReorderSuggestion>
    buildReorderSuggestions(
            List<Medicine> medicines,
            Map<Long, MedicineStock> stockMap
    ) {

        List<AiRecommendationResponse.ReorderSuggestion> result =
                new ArrayList<>();

        for (Medicine medicine : medicines) {

            MedicineStock stock = stockMap.getOrDefault(
                    medicine.getMedicineId(),
                    new MedicineStock()
            );

            int targetStock;

            if (stock.totalDemand > 0) {

                double averageDailyDemand =
                        stock.totalDemand / (double) HISTORY_DAYS;

                // Target: 14 days of predicted demand
                targetStock = (int) Math.ceil(
                        averageDailyDemand * REORDER_TARGET_DAYS
                );

            } else {

                // Use the configured minimum-stock buffer
                targetStock = stock.minimumStock * 2;
            }

            // No reorder needed if available stock meets the target
            if (stock.currentStock >= targetStock) {
                continue;
            }

            int suggestedQuantity =
                    targetStock - stock.currentStock;

            // Do not assume zero cost when price information is missing
            BigDecimal estimatedCost = null;

            if (stock.pricedQuantity > 0) {

                BigDecimal averageUnitPrice =
                        stock.totalStockValue.divide(
                                BigDecimal.valueOf(stock.pricedQuantity),
                                2,
                                RoundingMode.HALF_UP
                        );

                estimatedCost = averageUnitPrice.multiply(
                        BigDecimal.valueOf(suggestedQuantity)
                ).setScale(2, RoundingMode.HALF_UP);
            }

            String reason = stock.totalDemand > 0
                    ? "Current stock is below the estimated "
                        + REORDER_TARGET_DAYS + "-day demand."
                    : "Current stock is below the recommended minimum "
                        + "stock buffer. No recent demand history is available.";

            result.add(
                    new AiRecommendationResponse.ReorderSuggestion(
                            medicine.getMedicineId(),
                            medicine.getMedicineName(),
                            stock.currentStock,
                            suggestedQuantity,
                            estimatedCost,
                            reason
                    )
            );
        }

        // Sort by estimated cost, keeping unavailable prices last
        result.sort(Comparator.comparing(
                AiRecommendationResponse.ReorderSuggestion::getEstimatedCost,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return result;
    }

    // =========================================================
    // 5. RULE-BASED STOCK REPORT
    // =========================================================

    private AiRecommendationResponse.StockReport buildStockReport(
            List<Medicine> medicines,
            List<AiRecommendationResponse.LowStockItem> lowStockItems,
            List<AiRecommendationResponse.ExpiryRisk> expiryRisks,
            List<AiRecommendationResponse.ReorderSuggestion> reorderSuggestions,
            List<AiRecommendationResponse.DemandForecast> demandForecasts,
            LocalDateTime generatedAt
    ) {

        List<String> insights = new ArrayList<>();

        // Count medicines with zero available stock
        long criticalStockCount = lowStockItems.stream()
                .filter(item ->
                        "CRITICAL".equals(item.getSeverity())
                )
                .count();

        // Count already expired batches
        long expiredCount = expiryRisks.stream()
                .filter(item ->
                        "EXPIRED".equals(item.getRiskLevel())
                )
                .count();

        // Count batches expiring within 30 days
        long criticalExpiryCount = expiryRisks.stream()
                .filter(item ->
                        "CRITICAL".equals(item.getRiskLevel())
                )
                .count();

        // Low-stock insights
        if (lowStockItems.isEmpty()) {

            insights.add("No low-stock medicines detected.");

        } else {

            insights.add(
                    lowStockItems.size()
                    + " medicines are below their minimum stock level."
            );
        }

        // Zero-stock insights
        if (criticalStockCount > 0) {

            insights.add(
                    criticalStockCount
                    + " medicines have zero available stock."
            );
        }

        // Expired batch insights
        if (expiredCount > 0) {

            insights.add(
                    expiredCount
                    + " batches have already expired. Keep them excluded "
                    + "from dispensing stock and follow your pharmacy's "
                    + "disposal procedure."
            );
        }

        // Upcoming expiry insights
        if (criticalExpiryCount > 0) {

            insights.add(
                    criticalExpiryCount
                    + " batches are due to expire within 30 days. "
                    + "Prioritise review and follow applicable dispensing rules."
            );
        }

        // Reorder insights
        if (reorderSuggestions.isEmpty()) {

            insights.add("No reorder suggestions are currently required.");

        } else {

            insights.add(
                    reorderSuggestions.size()
                    + " medicines need a stock replenishment review."
            );
        }

        // Forecast insights
        long insufficientForecastCount = demandForecasts.stream()
                .filter(forecast ->
                        forecast.getCurrentStock()
                                < forecast.getPredictedSevenDayDemand()
                )
                .count();

        if (insufficientForecastCount > 0) {

            insights.add(
                    insufficientForecastCount
                    + " medicines may not have enough stock for the "
                    + "next " + FORECAST_DAYS
                    + " days based on recent outgoing movements."
            );
        }

        // Overall stock status
        String overallStatus;

        if (expiredCount > 0 || criticalStockCount > 0) {

            overallStatus = "CRITICAL";

        } else if (!lowStockItems.isEmpty()
                || !expiryRisks.isEmpty()
                || !reorderSuggestions.isEmpty()) {

            overallStatus = "WARNING";

        } else {

            overallStatus = "HEALTHY";
        }

        if (medicines.isEmpty()) {

            insights.add("No medicines are currently registered.");
            overallStatus = "WARNING";
        }

        return new AiRecommendationResponse.StockReport(
                generatedAt.toString(),
                overallStatus,
                insights
        );
    }

    // =========================================================
    // HELPER METHODS
    // =========================================================

    private long countCriticalExpiry(
            List<AiRecommendationResponse.ExpiryRisk> expiryRisks
    ) {

        // Count only batches expiring within 30 days.
        // Already expired batches are reported separately.
        return expiryRisks.stream()
                .filter(item ->
                        "CRITICAL".equals(item.getRiskLevel())
                )
                .count();
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // =========================================================
    // INTERNAL STOCK CALCULATION MODEL
    // =========================================================

    private static class MedicineStock {

        private int currentStock = 0;

        private int minimumStock = 0;

        private long totalDemand = 0;

        private BigDecimal totalStockValue = BigDecimal.ZERO;

        private int pricedQuantity = 0;
    }
}
