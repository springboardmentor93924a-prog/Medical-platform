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
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ExpiryRiskService {

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final StockLogRepository stockLogRepository;

    public record BatchRiskItem(
            Integer batchId,
            String batchNumber,
            LocalDate expiryDate,
            long daysUntilExpiry,
            int quantityAvailable,
            int unitsAtRisk,
            BigDecimal estimatedFinancialRisk,
            String riskCategory,
            LocalDate projectedDepletionDate,
            String actionRecommendation
    ) {}

    public record ExpiryRiskReport(
            Integer medicineId,
            String medicineName,
            double averageDailyUsage,
            int totalStock,
            int totalUnitsAtRisk,
            BigDecimal totalFinancialRisk,
            List<BatchRiskItem> batchDetails,
            Map<String, Integer> unitsByCategory
    ) {}

    public ExpiryRiskService(
            MedicineRepository medicineRepository,
            InventoryBatchRepository inventoryBatchRepository,
            StockLogRepository stockLogRepository) {
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.stockLogRepository = stockLogRepository;
    }

    /**
     * Simulates batch-by-batch FEFO depletion against consumption velocity.
     */
    public ExpiryRiskReport evaluateExpiryRisk(
            Integer medicineId,
            String medicineName,
            double adu,
            List<InventoryBatch> batches,
            LocalDate today) {

        if (batches == null) {
            batches = Collections.emptyList();
        }

        // Sort active batches strictly by expiry date ascending (FEFO order)
        List<InventoryBatch> sorted = batches.stream()
                .filter(b -> b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0)
                .sorted(Comparator.comparing(InventoryBatch::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(InventoryBatch::getBatchId))
                .toList();

        List<BatchRiskItem> items = new ArrayList<>();
        Map<String, Integer> unitsByCategory = new LinkedHashMap<>();
        unitsByCategory.put("EXPIRED", 0);
        unitsByCategory.put("CRITICAL_7_DAYS", 0);
        unitsByCategory.put("HIGH_30_DAYS", 0);
        unitsByCategory.put("MODERATE_60_DAYS", 0);
        unitsByCategory.put("WARNING_90_DAYS", 0);
        unitsByCategory.put("HEALTHY", 0);

        int totalStock = 0;
        int totalUnitsAtRisk = 0;
        BigDecimal totalFinancialRisk = BigDecimal.ZERO;

        int cumulativeUnitsConsumedBefore = 0;

        for (InventoryBatch b : sorted) {
            int qty = b.getQuantityAvailable();
            totalStock += qty;

            LocalDate exp = b.getExpiryDate();
            long daysLeft = (exp != null) ? ChronoUnit.DAYS.between(today, exp) : 999;
            BigDecimal costPerUnit = (b.getPurchaseCost() != null && b.getPurchaseCost().compareTo(BigDecimal.ZERO) > 0)
                    ? b.getPurchaseCost()
                    : BigDecimal.valueOf(10.00);

            String riskCat;
            int unitsAtRisk = 0;
            LocalDate depletionDate = null;
            String recommendation;

            if (daysLeft < 0) {
                riskCat = "EXPIRED";
                unitsAtRisk = qty;
                recommendation = "BLOCKED: Batch is expired. Immediate quarantine and disposal required.";
            } else {
                if (daysLeft <= 7) riskCat = "CRITICAL_7_DAYS";
                else if (daysLeft <= 30) riskCat = "HIGH_30_DAYS";
                else if (daysLeft <= 60) riskCat = "MODERATE_60_DAYS";
                else if (daysLeft <= 90) riskCat = "WARNING_90_DAYS";
                else riskCat = "HEALTHY";

                if (adu > 0) {
                    // Days required until this batch starts being dispensed
                    double daysUntilStart = cumulativeUnitsConsumedBefore / adu;
                    // Days required until this batch is completely consumed
                    double daysUntilEnd = (cumulativeUnitsConsumedBefore + qty) / adu;
                    depletionDate = today.plusDays((long) Math.ceil(daysUntilEnd));

                    // If expiry occurs before depletion, calculate unconsumed units
                    if (daysLeft < daysUntilEnd) {
                        double daysUsable = Math.max(0.0, daysLeft - daysUntilStart);
                        int unitsCanBeConsumed = (int) Math.floor(daysUsable * adu);
                        unitsAtRisk = Math.max(0, qty - unitsCanBeConsumed);
                        recommendation = String.format("FEFO PRIORITY: Dispense immediately. At current ADU (%.1f), %d units risk expiring before depletion.", adu, unitsAtRisk);
                    } else {
                        unitsAtRisk = 0;
                        recommendation = "Optimal FEFO flow: Expected to be fully dispensed prior to expiry.";
                    }
                } else {
                    // ADU is 0 (no consumption velocity)
                    unitsAtRisk = qty;
                    recommendation = "Zero consumption velocity recorded. All batch units risk expiring unless transferred or promoted.";
                }
            }

            unitsByCategory.put(riskCat, unitsByCategory.getOrDefault(riskCat, 0) + qty);
            totalUnitsAtRisk += unitsAtRisk;

            BigDecimal financialRisk = costPerUnit.multiply(BigDecimal.valueOf(unitsAtRisk)).setScale(2, RoundingMode.HALF_UP);
            totalFinancialRisk = totalFinancialRisk.add(financialRisk);

            cumulativeUnitsConsumedBefore += qty;

            items.add(new BatchRiskItem(
                    b.getBatchId(),
                    b.getBatchNumber(),
                    exp,
                    daysLeft,
                    qty,
                    unitsAtRisk,
                    financialRisk,
                    riskCat,
                    depletionDate,
                    recommendation
            ));
        }

        return new ExpiryRiskReport(
                medicineId,
                medicineName,
                Math.round(adu * 100.0) / 100.0,
                totalStock,
                totalUnitsAtRisk,
                totalFinancialRisk,
                items,
                unitsByCategory
        );
    }

    @Transactional(readOnly = true)
    public ExpiryRiskReport evaluateForMedicine(Integer medicineId) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + medicineId));

        LocalDate today = LocalDate.now();
        List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(medicineId);

        // Historical consumption over last 30 days
        LocalDateTime sinceTime = today.minusDays(30).atStartOfDay();
        List<StockLog> logs = stockLogRepository.findDispensedLogsForMedicineSince(medicineId, sinceTime);

        int totalDispensed = logs.stream()
                .mapToInt(l -> Math.abs(l.getQuantityChanged() != null ? l.getQuantityChanged() : 0))
                .sum();
        double adu = totalDispensed / 30.0;

        return evaluateExpiryRisk(
                medicine.getMedicineId(),
                medicine.getMedicineName(),
                adu,
                batches,
                today
        );
    }
}
