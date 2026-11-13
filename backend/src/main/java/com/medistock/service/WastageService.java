package com.medistock.service;

import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.MedicineReturn;

import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.MedicineReturnRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Wastage reporting.
 *
 * Combines three sources of loss:
 *   1. expired batches still holding stock
 *   2. batches expiring soon (value at risk)
 *   3. approved returns that cannot go back on the shelf
 *
 * It also returns the FEFO "use first" queue so staff know which
 * batches must leave the shelf before they expire.
 */
@Service
public class WastageService {

    public static final int DEFAULT_NEAR_EXPIRY_DAYS = 90;

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineReturnRepository medicineReturnRepository;

    public WastageService(
            InventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            MedicineReturnRepository medicineReturnRepository) {

        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.medicineReturnRepository = medicineReturnRepository;
    }

    /**
     * Build the full wastage report.
     *
     * @param nearExpiryDays window used to flag "expiring soon"
     */
    @Transactional(readOnly = true)
    public Map<String, Object> buildReport(int nearExpiryDays) {

        int window = nearExpiryDays <= 0
                ? DEFAULT_NEAR_EXPIRY_DAYS
                : nearExpiryDays;

        LocalDate today = LocalDate.now();
        LocalDate nearLimit = today.plusDays(window);

        Map<Long, Medicine> medicines = medicineRepository.findAll()
                .stream()
                .collect(Collectors.toMap(
                        Medicine::getMedicineId,
                        Function.identity(),
                        (a, b) -> a
                ));

        List<Inventory> all = inventoryRepository.findAll();

        List<Map<String, Object>> expired = new ArrayList<>();
        List<Map<String, Object>> nearExpiry = new ArrayList<>();
        List<Map<String, Object>> fefoQueue = new ArrayList<>();

        for (Inventory item : all) {

            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                continue;
            }

            if (item.getExpiryDate() == null) {
                continue;
            }

            LocalDate expiry = item.getExpiryDate();
            long days = ChronoUnit.DAYS.between(today, expiry);

            if (expiry.isBefore(today)) {
                expired.add(row(item, medicines, expiry, days));
            } else {
                if (!expiry.isAfter(nearLimit)) {
                    nearExpiry.add(row(item, medicines, expiry, days));
                }

                fefoQueue.add(row(item, medicines, expiry, days));
            }
        }

        expired.sort(Comparator.comparing(
                r -> (LocalDate) r.get("expiryDate")
        ));

        nearExpiry.sort(Comparator.comparing(
                r -> (LocalDate) r.get("expiryDate")
        ));

        fefoQueue.sort(Comparator
                .comparing((Map<String, Object> r) ->
                        (LocalDate) r.get("expiryDate"))
                .thenComparing(r -> (Long) r.get("inventoryId")));

        List<Map<String, Object>> returns = wastageReturns(medicines);

        BigDecimal expiredValue = sumValue(expired);
        BigDecimal nearExpiryValue = sumValue(nearExpiry);
        BigDecimal returnsValue = sumValue(returns);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("generatedAt", java.time.LocalDateTime.now());
        summary.put("nearExpiryDays", window);
        summary.put("expiredBatches", expired.size());
        summary.put("expiredUnits", sumUnits(expired));
        summary.put("expiredValue", money(expiredValue));
        summary.put("nearExpiryBatches", nearExpiry.size());
        summary.put("nearExpiryUnits", sumUnits(nearExpiry));
        summary.put("nearExpiryValue", money(nearExpiryValue));
        summary.put("wastageReturnCount", returns.size());
        summary.put("wastageReturnUnits", sumUnits(returns));
        summary.put("wastageReturnValue", money(returnsValue));
        summary.put("fefoBatchCount", fefoQueue.size());
        summary.put("fefoUnits", sumUnits(fefoQueue));
        summary.put(
                "totalWastageValue",
                money(expiredValue.add(returnsValue))
        );
        summary.put(
                "valueAtRisk",
                money(expiredValue.add(returnsValue).add(nearExpiryValue))
        );

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("summary", summary);
        report.put("expired", expired);
        report.put("nearExpiry", nearExpiry);
        report.put("wastageReturns", returns);
        report.put("fefoQueue", fefoQueue);

        return report;
    }

    /**
     * Approved returns that are not eligible to be restocked.
     */
    private List<Map<String, Object>> wastageReturns(
            Map<Long, Medicine> medicines) {

        List<MedicineReturn> approved =
                medicineReturnRepository.findByReturnStatusOrderByCreatedAtDesc(
                        "APPROVED"
                );

        Map<Long, Inventory> inventoryById = inventoryRepository.findAll()
                .stream()
                .collect(Collectors.toMap(
                        Inventory::getInventoryId,
                        Function.identity(),
                        (a, b) -> a
                ));

        List<Map<String, Object>> rows = new ArrayList<>();

        for (MedicineReturn item : approved) {

            if (Boolean.TRUE.equals(item.getRestockEligible())) {
                continue;
            }

            Inventory batch = inventoryById.get(item.getInventoryId());
            Medicine med = batch == null
                    ? null
                    : medicines.get(batch.getMedicineId());

            BigDecimal unitPrice = batch == null ||
                    batch.getUnitPrice() == null
                    ? BigDecimal.ZERO
                    : batch.getUnitPrice();

            int quantity = item.getReturnQuantity() == null
                    ? 0
                    : item.getReturnQuantity();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("returnId", item.getReturnId());
            row.put("inventoryId", item.getInventoryId());
            row.put("medicine", med == null
                    ? "Batch #" + item.getInventoryId()
                    : med.getMedicineName());
            row.put("batch", batch == null
                    ? ""
                    : batch.getBatchNumber());
            row.put("returnType", item.getReturnType());
            row.put("condition", item.getMedicineCondition());
            row.put("reason", item.getReturnReason());
            row.put("quantity", quantity);
            row.put("unitPrice", money(unitPrice));
            row.put("value", money(unitPrice.multiply(
                    BigDecimal.valueOf(quantity)
            )));
            row.put("returnDate", item.getReturnDate());
            rows.add(row);
        }

        return rows;
    }

    private Map<String, Object> row(
            Inventory item,
            Map<Long, Medicine> medicines,
            LocalDate expiry,
            long daysToExpiry) {

        Medicine med = medicines.get(item.getMedicineId());

        BigDecimal unitPrice = item.getUnitPrice() == null
                ? BigDecimal.ZERO
                : item.getUnitPrice();

        int quantity = item.getQuantity() == null
                ? 0
                : item.getQuantity();

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("inventoryId", item.getInventoryId());
        row.put("medicineId", item.getMedicineId());
        row.put("medicine", med == null
                ? "Medicine #" + item.getMedicineId()
                : med.getMedicineName());
        row.put("category", med == null ? "" : med.getCategory());
        row.put("batch", item.getBatchNumber());
        row.put("expiryDate", expiry);
        row.put("daysToExpiry", daysToExpiry);
        row.put("quantity", quantity);
        row.put("unitPrice", money(unitPrice));
        row.put("value", money(unitPrice.multiply(
                BigDecimal.valueOf(quantity)
        )));
        row.put("action", daysToExpiry < 0
                ? "Remove from shelf"
                : "Use first (FEFO)");

        return row;
    }

    private static BigDecimal sumValue(List<Map<String, Object>> rows) {
        BigDecimal total = BigDecimal.ZERO;

        for (Map<String, Object> row : rows) {
            Object value = row.get("value");
            if (value instanceof BigDecimal amount) {
                total = total.add(amount);
            }
        }

        return total;
    }

    private static long sumUnits(List<Map<String, Object>> rows) {
        long total = 0;

        for (Map<String, Object> row : rows) {
            Object value = row.get("quantity");
            if (value instanceof Number number) {
                total += number.longValue();
            }
        }

        return total;
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    /** Stock value of a single batch (unit price x quantity). */
    public static BigDecimal valueOf(Inventory item) {

        BigDecimal unitPrice = item.getUnitPrice() == null
                ? BigDecimal.ZERO
                : item.getUnitPrice();

        int quantity = item.getQuantity() == null
                ? 0
                : item.getQuantity();

        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
