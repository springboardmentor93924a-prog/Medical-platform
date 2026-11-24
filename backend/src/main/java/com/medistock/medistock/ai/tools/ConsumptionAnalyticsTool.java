package com.medistock.medistock.ai.tools;

import com.medistock.medistock.config.CacheConfig;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.entity.PurchaseOrderItem;
import com.medistock.medistock.entity.StockLog;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.PurchaseOrderItemRepository;
import com.medistock.medistock.repository.StockLogRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class ConsumptionAnalyticsTool {

    private final StockLogRepository stockLogRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final CurrentUserService currentUserService;

    public ConsumptionAnalyticsTool(
            StockLogRepository stockLogRepository,
            MedicineRepository medicineRepository,
            InventoryBatchRepository inventoryBatchRepository,
            PurchaseOrderItemRepository purchaseOrderItemRepository,
            CurrentUserService currentUserService) {
        this.stockLogRepository = stockLogRepository;
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves actual historical medicine consumption from stock dispensing logs.
     * Roles: Admin & Pharmacist only.
     */
    public Map<String, Object> getConsumptionHistory(Integer medicineId, Integer days) {
        verifyAdminOrPharmacist("view consumption history");

        Medicine med = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + medicineId));

        int windowDays = (days != null && days > 0 && days <= 365) ? days : 30;
        LocalDateTime since = LocalDateTime.now().minusDays(windowDays);

        List<StockLog> dispensedLogs = stockLogRepository.findDispensedLogsForMedicineSince(medicineId, since);

        int totalDispensed = 0;
        Map<LocalDate, Integer> dailyTotals = new TreeMap<>();

        for (StockLog log : dispensedLogs) {
            int qty = Math.abs(log.getQuantityChanged() != null ? log.getQuantityChanged() : 0);
            totalDispensed += qty;
            LocalDate day = log.getCreatedAt().toLocalDate();
            dailyTotals.put(day, dailyTotals.getOrDefault(day, 0) + qty);
        }

        double averageDailyUsage = windowDays > 0 ? (double) totalDispensed / windowDays : 0.0;
        averageDailyUsage = Math.round(averageDailyUsage * 100.0) / 100.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("medicineId", med.getMedicineId());
        result.put("medicineName", med.getMedicineName());
        result.put("genericName", med.getGenericName());
        result.put("analysisWindowDays", windowDays);
        result.put("totalUnitsDispensed", totalDispensed);
        result.put("averageDailyUsage", averageDailyUsage);
        result.put("dispensingTransactionCount", dispensedLogs.size());
        result.put("activeDaysWithDispensing", dailyTotals.size());

        List<Map<String, Object>> recentEvents = new ArrayList<>();
        for (StockLog sl : dispensedLogs.stream().limit(10).toList()) {
            recentEvents.add(Map.of(
                    "logId", sl.getStockLogId(),
                    "date", sl.getCreatedAt().toString(),
                    "quantityDispensed", Math.abs(sl.getQuantityChanged()),
                    "batchId", sl.getBatchId()
            ));
        }
        result.put("recentDispensingEvents", recentEvents);

        return result;
    }

    /**
     * Computes high-level pharmacy inventory velocity and health statistics.
     * Roles: Admin & Pharmacist only.
     */
    @Cacheable(value = CacheConfig.CACHE_INVENTORY_ANALYTICS)
    public Map<String, Object> getInventoryAnalytics() {
        verifyAdminOrPharmacist("view inventory analytics");

        LocalDate today = LocalDate.now();
        List<Medicine> allMeds = medicineRepository.findAll();
        List<InventoryBatch> allBatches = inventoryBatchRepository.findAll();

        int totalBatches = allBatches.size();
        int healthyBatches = 0;
        int atRiskBatches = 0;
        int expiredBatches = 0;
        int totalUsableUnits = 0;

        for (InventoryBatch b : allBatches) {
            int qty = b.getQuantityAvailable() != null ? b.getQuantityAvailable() : 0;
            String st = b.getStatus() != null ? b.getStatus().toUpperCase() : "ACTIVE";
            boolean isExpired = (b.getExpiryDate() != null && b.getExpiryDate().isBefore(today)) || "EXPIRED".equals(st);

            if (isExpired) {
                expiredBatches++;
            } else if ("QUARANTINED".equals(st) || "RECALLED".equals(st)) {
                atRiskBatches++;
            } else if (b.getExpiryDate() != null && b.getExpiryDate().isBefore(today.plusDays(30))) {
                atRiskBatches++;
                totalUsableUnits += qty;
            } else {
                healthyBatches++;
                totalUsableUnits += qty;
            }
        }

        double healthPercentage = totalBatches > 0
                ? Math.round(((double) healthyBatches / totalBatches) * 1000.0) / 10.0
                : 100.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalMedicineSKUs", allMeds.size());
        result.put("totalBatchesInSystem", totalBatches);
        result.put("healthyBatchesCount", healthyBatches);
        result.put("atRiskBatchesCount", atRiskBatches);
        result.put("expiredBatchesCount", expiredBatches);
        result.put("totalUsableUnitsOnHand", totalUsableUnits);
        result.put("inventoryHealthPercentage", healthPercentage + "%");

        return result;
    }

    /**
     * Derives real historical purchase cost trends from Purchase Order items.
     * Roles: Admin & Pharmacist only.
     */
    public Map<String, Object> getPurchasePriceTrends(Integer medicineId) {
        verifyAdminOrPharmacist("view purchase price trends");

        Medicine med = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + medicineId));

        List<PurchaseOrderItem> items = purchaseOrderItemRepository.findByMedicineIdOrderByPurchaseOrderItemIdDesc(medicineId);

        if (items.isEmpty()) {
            return Map.of(
                    "medicineId", med.getMedicineId(),
                    "medicineName", med.getMedicineName(),
                    "hasHistoricalOrders", false,
                    "message", "No historical purchase order line items recorded for this medicine."
            );
        }

        BigDecimal latestCost = items.get(0).getUnitCost();
        BigDecimal earliestCost = items.get(items.size() - 1).getUnitCost();

        BigDecimal delta = latestCost.subtract(earliestCost);
        BigDecimal percentageChange = BigDecimal.ZERO;
        if (earliestCost.compareTo(BigDecimal.ZERO) > 0) {
            percentageChange = delta.multiply(BigDecimal.valueOf(100))
                    .divide(earliestCost, 2, RoundingMode.HALF_UP);
        }

        List<Map<String, Object>> priceHistory = new ArrayList<>();
        for (PurchaseOrderItem item : items.stream().limit(10).toList()) {
            priceHistory.add(Map.of(
                    "purchaseOrderId", item.getPurchaseOrderId(),
                    "quantityOrdered", item.getQuantity(),
                    "unitCost", item.getUnitCost(),
                    "subtotal", item.getSubtotal() != null ? item.getSubtotal() : item.getUnitCost().multiply(BigDecimal.valueOf(item.getQuantity()))
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("medicineId", med.getMedicineId());
        result.put("medicineName", med.getMedicineName());
        result.put("hasHistoricalOrders", true);
        result.put("totalOrdersEvaluated", items.size());
        result.put("latestUnitCost", latestCost);
        result.put("earliestRecordedUnitCost", earliestCost);
        result.put("costChangePercentage", percentageChange + "%");
        result.put("trend", delta.compareTo(BigDecimal.ZERO) > 0 ? "INCREASING" : (delta.compareTo(BigDecimal.ZERO) < 0 ? "DECREASING" : "STABLE"));
        result.put("priceHistory", priceHistory);

        return result;
    }

    private void verifyAdminOrPharmacist(String operation) {
        String role = currentUserService != null ? currentUserService.getCurrentUserRole() : "ADMIN";
        if (!Set.of("ADMIN", "PHARMACIST").contains(role.toUpperCase())) {
            throw new SecurityException("Access Denied: Role [" + role + "] is not authorized to " + operation + ".");
        }
    }
}

