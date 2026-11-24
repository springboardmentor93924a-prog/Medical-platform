package com.medistock.medistock.ai.reorder;

import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.entity.PurchaseOrderItem;
import com.medistock.medistock.entity.StockLog;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.PurchaseOrderItemRepository;
import com.medistock.medistock.repository.StockLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReorderCalculationService {

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final StockLogRepository stockLogRepository;

    public record ReorderPlan(
            Integer medicineId,
            String medicineName,
            double averageDailyUsage,
            int leadTimeDays,
            double dailyDemandStdDev,
            double serviceLevelZ,
            int safetyStock,
            int reorderPoint,
            int usableStock,
            int incomingOrdersStock,
            int netAvailableStock,
            int forecast30DayDemand,
            int suggestedOrderQuantity,
            boolean reorderTriggered,
            String urgency,
            String explanation
    ) {}

    public ReorderCalculationService(
            MedicineRepository medicineRepository,
            InventoryBatchRepository inventoryBatchRepository,
            PurchaseOrderItemRepository purchaseOrderItemRepository,
            StockLogRepository stockLogRepository) {
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
        this.stockLogRepository = stockLogRepository;
    }

    /**
     * Pure calculation engine:
     * ROP = ADU * LT + SS
     * SS = z * sigma_d * sqrt(LT)
     * Q = max(0, F_horizon + SS - UsableStock - IncomingStock)
     */
    public ReorderPlan computeReorderPlan(
            Integer medicineId,
            String medicineName,
            double adu,
            int leadTimeDays,
            double dailyStdDev,
            int usableStock,
            int incomingStock,
            Double serviceLevelZ,
            int horizonDays) {

        if (adu < 0) {
            throw new IllegalArgumentException("ADU cannot be negative.");
        }
        if (leadTimeDays <= 0) {
            leadTimeDays = 7; // Default pharmaceutical supplier lead time
        }
        if (horizonDays <= 0) {
            horizonDays = 30; // Default 30-day planning horizon
        }
        double z = (serviceLevelZ != null && serviceLevelZ > 0) ? serviceLevelZ : 1.65; // 95% service level

        // 1. Safety Stock: SS = z * sigma_d * sqrt(LT)
        double rawSafety = z * dailyStdDev * Math.sqrt(leadTimeDays);
        int safetyStock = (int) Math.ceil(rawSafety);

        // Safeguard: Ensure at least min buffer for non-zero demand items
        if (adu > 0) {
            int baselineBuffer = (int) Math.ceil(3.0 * adu);
            safetyStock = Math.max(safetyStock, baselineBuffer);
            safetyStock = Math.max(1, safetyStock);
        } else {
            safetyStock = 0;
        }

        // 2. Reorder Point: ROP = ADU * LT + SS
        int rop = (int) Math.ceil(adu * leadTimeDays) + safetyStock;

        // 3. 30-day forecast demand: F = ADU * horizonDays
        int forecastDemand = (int) Math.round(adu * horizonDays);

        // 4. Net Available Stock
        int netAvailable = usableStock + incomingStock;

        // 5. Replenishment Quantity: Q = max(0, F + SS - U - I)
        int suggestedQty = 0;
        boolean reorderTriggered = (netAvailable <= rop);

        if (reorderTriggered) {
            int rawDeficit = forecastDemand + safetyStock - netAvailable;
            if (rawDeficit > 0) {
                // Round up to nearest standard packaging multiple (e.g. 10 units)
                suggestedQty = ((rawDeficit + 9) / 10) * 10;
                suggestedQty = Math.max(10, suggestedQty);
            }
        }

        // Urgency classification
        String urgency;
        if (usableStock == 0) {
            urgency = "STOCKOUT_IMMINENT";
        } else if (usableStock <= Math.ceil(adu * leadTimeDays)) {
            urgency = "CRITICAL_SHORTAGE";
        } else if (reorderTriggered) {
            urgency = "REORDER_RECOMMENDED";
        } else {
            urgency = "ADEQUATE";
        }

        // Explanation narrative
        String explanation;
        if (reorderTriggered) {
            explanation = String.format(
                    "Net available stock (%d units: %d on hand + %d on order) is at or below the reorder point (%d units). " +
                    "With lead time of %d days and ADU of %.1f units/day, a replenishment of %d units is required to maintain safety stock (%d units) over the %d-day horizon.",
                    netAvailable, usableStock, incomingStock, rop, leadTimeDays, adu, suggestedQty, safetyStock, horizonDays
            );
        } else {
            explanation = String.format(
                    "Current stock position is healthy. Net available stock of %d units exceeds the reorder point of %d units (Safety stock: %d units). No immediate replenishment required.",
                    netAvailable, rop, safetyStock
            );
        }

        return new ReorderPlan(
                medicineId,
                medicineName,
                Math.round(adu * 100.0) / 100.0,
                leadTimeDays,
                Math.round(dailyStdDev * 100.0) / 100.0,
                z,
                safetyStock,
                rop,
                usableStock,
                incomingStock,
                netAvailable,
                forecastDemand,
                suggestedQty,
                reorderTriggered,
                urgency,
                explanation
        );
    }

    /**
     * Evaluates live database records for a given medicine.
     */
    @Transactional(readOnly = true)
    public ReorderPlan calculateForMedicine(Integer medicineId) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + medicineId));

        LocalDate today = LocalDate.now();

        // 1. Calculate usable stock (non-expired, non-quarantined, non-recalled)
        List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(medicineId);
        int usableStock = batches.stream()
                .filter(b -> b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0)
                .filter(b -> {
                    String status = b.getStatus() != null ? b.getStatus().toUpperCase() : "ACTIVE";
                    return !"EXPIRED".equals(status) && !"QUARANTINED".equals(status) && !"RECALLED".equals(status);
                })
                .filter(b -> b.getExpiryDate() == null || !b.getExpiryDate().isBefore(today))
                .mapToInt(InventoryBatch::getQuantityAvailable)
                .sum();

        // 2. Confirmed incoming orders
        List<PurchaseOrderItem> incomingItems = purchaseOrderItemRepository.findActiveIncomingOrderItems();
        int incomingStock = incomingItems.stream()
                .filter(item -> Objects.equals(item.getMedicineId(), medicineId))
                .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                .sum();

        // 3. Historical daily consumption statistics over past 30 days
        LocalDateTime sinceTime = today.minusDays(30).atStartOfDay();
        List<StockLog> logs = stockLogRepository.findDispensedLogsForMedicineSince(medicineId, sinceTime);

        Map<LocalDate, Double> dailyMap = new HashMap<>();
        for (StockLog log : logs) {
            if (log.getCreatedAt() != null) {
                LocalDate logDate = log.getCreatedAt().toLocalDate();
                double qty = Math.abs(log.getQuantityChanged() != null ? log.getQuantityChanged() : 0);
                dailyMap.put(logDate, dailyMap.getOrDefault(logDate, 0.0) + qty);
            }
        }

        // Build continuous 30-day series
        double[] series30 = new double[30];
        double sum = 0.0;
        for (int i = 0; i < 30; i++) {
            LocalDate d = today.minusDays(29 - i);
            double val = dailyMap.getOrDefault(d, 0.0);
            series30[i] = val;
            sum += val;
        }

        double adu = sum / 30.0;

        // Daily standard deviation
        double varianceSum = 0.0;
        for (double v : series30) {
            varianceSum += Math.pow(v - adu, 2);
        }
        double stdDev = Math.sqrt(varianceSum / 30.0);

        int leadTimeDays = 7; // Standard pharma lead time

        return computeReorderPlan(
                medicine.getMedicineId(),
                medicine.getMedicineName(),
                adu,
                leadTimeDays,
                stdDev,
                usableStock,
                incomingStock,
                1.65, // 95% service level
                30    // 30 days planning horizon
        );
    }
}
