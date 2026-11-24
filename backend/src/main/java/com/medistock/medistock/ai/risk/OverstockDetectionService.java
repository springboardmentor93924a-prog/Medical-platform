package com.medistock.medistock.ai.risk;

import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.entity.StockLog;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.StockLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class OverstockDetectionService {

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final StockLogRepository stockLogRepository;

    public record OverstockAnalysis(
            Integer medicineId,
            String medicineName,
            int usableStock,
            double averageDailyUsage,
            double daysOfCover,
            int targetMaxStock,
            int excessUnits,
            BigDecimal excessValue,
            String inventoryStatus,
            boolean isOverstocked,
            boolean isSlowMoving,
            String recommendation
    ) {}

    public OverstockDetectionService(
            MedicineRepository medicineRepository,
            InventoryBatchRepository inventoryBatchRepository,
            StockLogRepository stockLogRepository) {
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.stockLogRepository = stockLogRepository;
    }

    /**
     * Pure analytical calculation for overstock and slow-moving identification.
     */
    public OverstockAnalysis analyze(
            Integer medicineId,
            String medicineName,
            int usableStock,
            double adu,
            int leadTimeDays,
            BigDecimal unitCost) {

        if (leadTimeDays <= 0) leadTimeDays = 7;
        if (unitCost == null || unitCost.compareTo(BigDecimal.ZERO) <= 0) {
            unitCost = BigDecimal.valueOf(12.00);
        }

        double daysOfCover;
        if (usableStock == 0) {
            daysOfCover = 0.0;
        } else if (adu > 0.01) {
            daysOfCover = Math.round((usableStock / adu) * 10.0) / 10.0;
        } else {
            daysOfCover = 999.0; // Infinite/very large cover
        }

        // Target Max Stock = ADU * (leadTime + 30 days review cycle) + Safety Stock buffer
        int safetyBuffer = (adu > 0) ? (int) Math.ceil(5.0 * adu) : 10;
        int targetMax = (int) Math.ceil(adu * (leadTimeDays + 30)) + safetyBuffer;
        targetMax = Math.max(50, targetMax);

        int excessUnits = Math.max(0, usableStock - targetMax);
        BigDecimal excessValue = unitCost.multiply(BigDecimal.valueOf(excessUnits)).setScale(2, RoundingMode.HALF_UP);

        boolean isOverstocked = (daysOfCover > 90.0 && usableStock > 100 && excessUnits > 0);
        boolean isSlowMoving = (adu < 0.2 && usableStock > 30);

        String status;
        String recommendation;

        if (usableStock == 0) {
            status = "STOCKOUT";
            recommendation = "Emergency replenishment required immediately.";
        } else if (daysOfCover <= leadTimeDays) {
            status = "CRITICAL_SHORTAGE";
            recommendation = "Current stock covers only " + daysOfCover + " days. Place replenishment order promptly.";
        } else if (isOverstocked) {
            status = "OVERSTOCKED";
            recommendation = String.format(
                    "Overstock alert: Inventory of %d units covers %.0f days of demand (target ceiling: %d units). " +
                    "Excess capital tied: %d units (~$%.2f). Pause new purchase orders and monitor expiry.",
                    usableStock, daysOfCover, targetMax, excessUnits, excessValue
            );
        } else if (isSlowMoving) {
            status = "SLOW_MOVING";
            recommendation = String.format(
                    "Slow-moving catalog item: Dispensing velocity is very low (%.2f units/day) with %d units in stock. " +
                    "Avoid restocking and review batch expiration dates.",
                    adu, usableStock
            );
        } else {
            status = "ADEQUATE";
            recommendation = String.format("Stock balance is optimal (%d units, %.0f days of cover). Normal FEFO operations continue.", usableStock, daysOfCover);
        }

        return new OverstockAnalysis(
                medicineId,
                medicineName,
                usableStock,
                Math.round(adu * 100.0) / 100.0,
                daysOfCover,
                targetMax,
                excessUnits,
                excessValue,
                status,
                isOverstocked,
                isSlowMoving,
                recommendation
        );
    }

    @Transactional(readOnly = true)
    public OverstockAnalysis analyzeForMedicine(Integer medicineId) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + medicineId));

        LocalDate today = LocalDate.now();
        List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(medicineId);

        int usableStock = 0;
        BigDecimal unitCost = BigDecimal.valueOf(12.00);

        for (InventoryBatch b : batches) {
            if (b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0) {
                String st = b.getStatus() != null ? b.getStatus().toUpperCase() : "ACTIVE";
                boolean eligible = !"EXPIRED".equals(st) && !"QUARANTINED".equals(st) && !"RECALLED".equals(st);
                if (b.getExpiryDate() != null && b.getExpiryDate().isBefore(today)) {
                    eligible = false;
                }
                if (eligible) {
                    usableStock += b.getQuantityAvailable();
                }
            }
            if (b.getPurchaseCost() != null && b.getPurchaseCost().compareTo(BigDecimal.ZERO) > 0) {
                unitCost = b.getPurchaseCost();
            }
        }

        // 30 days consumption
        LocalDateTime sinceTime = today.minusDays(30).atStartOfDay();
        List<StockLog> logs = stockLogRepository.findDispensedLogsForMedicineSince(medicineId, sinceTime);

        int totalDispensed = logs.stream()
                .mapToInt(l -> Math.abs(l.getQuantityChanged() != null ? l.getQuantityChanged() : 0))
                .sum();
        double adu = totalDispensed / 30.0;

        return analyze(
                medicine.getMedicineId(),
                medicine.getMedicineName(),
                usableStock,
                adu,
                7,
                unitCost
        );
    }
}
