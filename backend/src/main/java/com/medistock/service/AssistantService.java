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
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Built-in MediStock assistant.
 *
 * Deliberately rule-based: it answers common inventory questions from
 * the local database and never calls an external model, so it needs no
 * API key and sends no data outside the deployment.
 */
@Service
public class AssistantService {

    private static final int NEAR_EXPIRY_DAYS = 90;
    private static final int ROW_LIMIT = 8;

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineReturnRepository medicineReturnRepository;
    private final WastageService wastageService;

    public AssistantService(
            InventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            MedicineReturnRepository medicineReturnRepository,
            WastageService wastageService) {

        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.medicineReturnRepository = medicineReturnRepository;
        this.wastageService = wastageService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> answer(String message) {

        String text = message == null
                ? ""
                : message.trim().toLowerCase(Locale.ROOT);

        if (text.isBlank()) {
            return reply(
                    "help",
                    "Ask me about low stock, expiring or expired batches, "
                            + "FEFO dispensing, wastage, returns or reordering.",
                    List.of(),
                    suggestions()
            );
        }

        if (containsAny(text, "low stock", "low on stock", "low-stock",
                "below minimum", "shortage", "running low",
                "reorder level", "minimum stock")) {
            return lowStock();
        }

        if (containsAny(text, "expiring", "expires", "expire in",
                "expire soon", "expiry", "near expiry", "near-expiry",
                "expiry soon", "about to expire", "next 30 days",
                "next 90 days")) {
            return nearExpiry();
        }

        if (containsAny(text, "expired", "past expiry", "already expired")) {
            return expired();
        }

        if (containsAny(text, "fefo", "first expiring", "first-expiry",
                "use first", "use-first", "which batch")) {
            return fefo();
        }

        if (containsAny(text, "wastage", "waste", "loss", "write off",
                "write-off", "damaged")) {
            return wastage();
        }

        if (containsAny(text, "return", "supplier return", "send back")) {
            return returns();
        }

        if (containsAny(text, "reorder", "purchase", "order more",
                "buy more")) {
            return reorder();
        }

        if (containsAny(text, "stock", "overview", "summary", "inventory",
                "how many", "total")) {
            return overview();
        }

        if (containsAny(text, "help", "what can you do", "options")) {
            return reply(
                    "help",
                    "I can report low stock, expiring batches, expired "
                            + "stock, the FEFO use-first queue, wastage "
                            + "value and pending returns.",
                    List.of(),
                    suggestions()
            );
        }

        return medicineLookup(text);
    }

    // ---------- INTENTS ----------

    private Map<String, Object> overview() {

        List<Inventory> all = inventoryRepository.findAll();

        int batches = all.size();
        int units = all.stream()
                .map(Inventory::getQuantity)
                .filter(q -> q != null)
                .mapToInt(Integer::intValue)
                .sum();

        List<Inventory> low = all.stream()
                .filter(this::isLowStock)
                .toList();

        LocalDate today = LocalDate.now();

        long expired = all.stream()
                .filter(i -> hasStock(i) && i.getExpiryDate() != null)
                .filter(i -> i.getExpiryDate().isBefore(today))
                .count();

        long expiring = all.stream()
                .filter(i -> hasStock(i) && i.getExpiryDate() != null)
                .filter(i -> !i.getExpiryDate().isBefore(today))
                .filter(i -> !i.getExpiryDate()
                        .isAfter(today.plusDays(NEAR_EXPIRY_DAYS)))
                .count();

        BigDecimal value = all.stream()
                .filter(this::hasStock)
                .map(WastageService::valueOf)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String answer = String.format(
                "There are %d batches holding %d units, worth about INR %s. "
                        + "%d are low on stock, %d batch(es) have expired "
                        + "and %d expire within %d days.",
                batches,
                units,
                value.setScale(2, java.math.RoundingMode.HALF_UP),
                low.size(),
                expired,
                expiring,
                NEAR_EXPIRY_DAYS
        );

        return reply(
                "overview",
                answer,
                List.of(),
                suggestions()
        );
    }

    private Map<String, Object> lowStock() {

        Map<Long, Medicine> medicines = medicineMap();

        List<Inventory> low = inventoryRepository.findAll()
                .stream()
                .filter(this::isLowStock)
                .sorted(Comparator.comparingInt(
                        i -> i.getQuantity() == null ? 0 : i.getQuantity()
                ))
                .toList();

        List<Map<String, Object>> rows = low.stream()
                .map(i -> row(i, medicines, "Reorder"))
                .toList();

        String answer = low.isEmpty()
                ? "Nothing is below its minimum stock level right now."
                : low.size() + " batch(es) are at or below minimum stock. "
                        + "Raise a purchase order for the items listed.";

        return reply("low_stock", answer, rows, suggestions());
    }

    private Map<String, Object> nearExpiry() {

        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(NEAR_EXPIRY_DAYS);
        Map<Long, Medicine> medicines = medicineMap();

        List<Inventory> items = inventoryRepository.findAll()
                .stream()
                .filter(this::hasStock)
                .filter(i -> i.getExpiryDate() != null)
                .filter(i -> !i.getExpiryDate().isBefore(today))
                .filter(i -> !i.getExpiryDate().isAfter(limit))
                .sorted(Comparator.comparing(Inventory::getExpiryDate))
                .toList();

        List<Map<String, Object>> rows = items.stream()
                .map(i -> row(i, medicines, "Use first (FEFO)"))
                .toList();

        String answer = items.isEmpty()
                ? "No batch expires within the next "
                        + NEAR_EXPIRY_DAYS + " days."
                : items.size() + " batch(es) expire within "
                        + NEAR_EXPIRY_DAYS
                        + " days. Dispense them first to avoid wastage.";

        return reply("near_expiry", answer, rows, suggestions());
    }

    private Map<String, Object> expired() {

        LocalDate today = LocalDate.now();
        Map<Long, Medicine> medicines = medicineMap();

        List<Inventory> items = inventoryRepository.findAll()
                .stream()
                .filter(this::hasStock)
                .filter(i -> i.getExpiryDate() != null)
                .filter(i -> i.getExpiryDate().isBefore(today))
                .sorted(Comparator.comparing(Inventory::getExpiryDate))
                .toList();

        List<Map<String, Object>> rows = items.stream()
                .map(i -> row(i, medicines, "Remove from shelf"))
                .toList();

        BigDecimal value = items.stream()
                .map(WastageService::valueOf)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String answer = items.isEmpty()
                ? "No expired batch is still holding stock."
                : items.size() + " expired batch(es) still hold "
                        + items.stream()
                                .map(Inventory::getQuantity)
                                .mapToInt(q -> q == null ? 0 : q)
                                .sum()
                        + " units worth INR "
                        + value.setScale(
                                2,
                                java.math.RoundingMode.HALF_UP
                        )
                        + ". Remove them from the shelf and record wastage.";

        return reply("expired", answer, rows, suggestions());
    }

    private Map<String, Object> fefo() {

        LocalDate today = LocalDate.now();
        Map<Long, Medicine> medicines = medicineMap();

        List<Inventory> items = inventoryRepository.findAll()
                .stream()
                .filter(this::hasStock)
                .filter(i -> i.getExpiryDate() != null)
                .filter(i -> !i.getExpiryDate().isBefore(today))
                .sorted(Comparator
                        .comparing(Inventory::getExpiryDate)
                        .thenComparing(Inventory::getInventoryId))
                .limit(ROW_LIMIT)
                .toList();

        List<Map<String, Object>> rows = items.stream()
                .map(i -> row(i, medicines, "Dispense first"))
                .toList();

        String answer = items.isEmpty()
                ? "There are no unexpired batches holding stock."
                : "FEFO order: dispense the earliest-expiring batch first. "
                        + "The first "
                        + items.size()
                        + " batch(es) to leave the shelf are listed.";

        return reply("fefo", answer, rows, suggestions());
    }

    private Map<String, Object> wastage() {

        Map<String, Object> report =
                wastageService.buildReport(NEAR_EXPIRY_DAYS);

        Map<?, ?> summary = (Map<?, ?>) report.get("summary");

        String answer = String.format(
                "Expired stock is worth INR %s (%s units). Approved "
                        + "non-restock returns add INR %s, so booked "
                        + "wastage is INR %s. Another INR %s is at risk "
                        + "from batches expiring within %s days.",
                summary.get("expiredValue"),
                summary.get("expiredUnits"),
                summary.get("wastageReturnValue"),
                summary.get("totalWastageValue"),
                summary.get("nearExpiryValue"),
                summary.get("nearExpiryDays")
        );

        List<Map<String, Object>> rows = new ArrayList<>();

        Object expired = report.get("expired");
        if (expired instanceof List<?> list) {
            for (Object entry : list) {
                if (entry instanceof Map<?, ?> row && rows.size() < ROW_LIMIT) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> typed = (Map<String, Object>) row;
                    rows.add(typed);
                }
            }
        }

        return reply("wastage", answer, rows, suggestions());
    }

    private Map<String, Object> returns() {

        List<MedicineReturn> pending =
                medicineReturnRepository.findByReturnStatusOrderByCreatedAtDesc(
                        "PENDING"
                );

        List<Map<String, Object>> rows = pending.stream()
                .limit(ROW_LIMIT)
                .map(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("returnId", item.getReturnId());
                    row.put("inventoryId", item.getInventoryId());
                    row.put("quantity", item.getReturnQuantity());
                    row.put("condition", item.getMedicineCondition());
                    row.put("reason", item.getReturnReason());
                    row.put("status", item.getReturnStatus());
                    row.put("returnDate", item.getReturnDate());
                    return row;
                })
                .toList();

        long approved = medicineReturnRepository
                .countByReturnStatus("APPROVED");

        String answer = pending.isEmpty()
                ? "No supplier returns are waiting for a decision."
                : pending.size()
                        + " supplier return(s) are pending pharmacist "
                        + "approval. " + approved
                        + " return(s) have been approved so far.";

        return reply("returns", answer, rows, suggestions());
    }

    private Map<String, Object> reorder() {

        Map<Long, Medicine> medicines = medicineMap();

        List<Inventory> low = inventoryRepository.findAll()
                .stream()
                .filter(this::isLowStock)
                .sorted(Comparator.comparingInt(
                        i -> i.getQuantity() == null ? 0 : i.getQuantity()
                ))
                .toList();

        List<Map<String, Object>> rows = low.stream()
                .map(i -> {
                    Map<String, Object> row = row(i, medicines, "Reorder");
                    int minimum = i.getMinimumStock() == null
                            ? 0
                            : i.getMinimumStock();
                    int quantity = i.getQuantity() == null
                            ? 0
                            : i.getQuantity();
                    row.put(
                            "suggestedOrder",
                            Math.max(minimum * 2 - quantity, minimum)
                    );
                    return row;
                })
                .toList();

        String answer = low.isEmpty()
                ? "No reorder is needed; every batch is above its minimum."
                : "Reorder " + low.size()
                        + " item(s). Suggested quantities bring stock "
                        + "back to twice the minimum level.";

        return reply("reorder", answer, rows, suggestions());
    }

    private Map<String, Object> medicineLookup(String text) {

        Map<Long, Medicine> medicines = medicineMap();

        Medicine match = medicines.values()
                .stream()
                .filter(m -> m.getMedicineName() != null)
                .filter(m -> {
                    String name = m.getMedicineName()
                            .toLowerCase(Locale.ROOT);
                    return text.contains(name)
                            || name.contains(text)
                            || sharesWord(text, name);
                })
                .findFirst()
                .orElse(null);

        if (match == null) {
            return reply(
                    "unknown",
                    "I could not match that question. I can help with low "
                            + "stock, expiry, FEFO, wastage, returns and "
                            + "reordering. Try naming a medicine, for "
                            + "example \"Paracetamol\".",
                    List.of(),
                    suggestions()
            );
        }

        List<Inventory> batches = inventoryRepository
                .findByMedicineId(match.getMedicineId())
                .stream()
                .sorted(Comparator.comparing(
                        Inventory::getExpiryDate,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();

        List<Map<String, Object>> rows = batches.stream()
                .map(i -> row(i, medicines, hasStock(i)
                        ? "Dispense first (FEFO)"
                        : "Out of stock"))
                .toList();

        int units = batches.stream()
                .map(Inventory::getQuantity)
                .mapToInt(q -> q == null ? 0 : q)
                .sum();

        String answer = match.getMedicineName() + " has "
                + batches.size() + " batch(es) and " + units
                + " units on hand. Batches are listed earliest expiry first.";

        return reply("medicine", answer, rows, suggestions());
    }

    // ---------- HELPERS ----------

    private Map<Long, Medicine> medicineMap() {
        return medicineRepository.findAll()
                .stream()
                .collect(Collectors.toMap(
                        Medicine::getMedicineId,
                        Function.identity(),
                        (a, b) -> a
                ));
    }

    private Map<String, Object> row(
            Inventory item,
            Map<Long, Medicine> medicines,
            String action) {

        Medicine med = medicines.get(item.getMedicineId());
        LocalDate today = LocalDate.now();

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("inventoryId", item.getInventoryId());
        row.put("medicine", med == null
                ? "Medicine #" + item.getMedicineId()
                : med.getMedicineName());
        row.put("batch", item.getBatchNumber());
        row.put("quantity", item.getQuantity());
        row.put("minimumStock", item.getMinimumStock());
        row.put("expiryDate", item.getExpiryDate());
        row.put(
                "daysToExpiry",
                item.getExpiryDate() == null
                        ? null
                        : ChronoUnit.DAYS.between(
                                today,
                                item.getExpiryDate()
                        )
        );
        row.put("action", action);
        return row;
    }

    private Map<String, Object> reply(
            String intent,
            String answer,
            List<Map<String, Object>> rows,
            List<String> suggestions) {

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("intent", intent);
        result.put("answer", answer);
        result.put("rows", rows);
        result.put("suggestions", suggestions);
        return result;
    }

    private static List<String> suggestions() {
        return List.of(
                "Which items are low on stock?",
                "What expires in the next 90 days?",
                "Show expired batches",
                "What is our total wastage?",
                "Which batch should I dispense first?",
                "Show pending returns"
        );
    }

    private boolean isLowStock(Inventory item) {
        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
        int minimum = item.getMinimumStock() == null
                ? 0
                : item.getMinimumStock();
        return quantity <= minimum;
    }

    private boolean hasStock(Inventory item) {
        return item.getQuantity() != null && item.getQuantity() > 0;
    }

    private static boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private static boolean sharesWord(String text, String name) {
        for (String word : name.split("\\s+")) {
            if (word.length() >= 4 && text.contains(word)) {
                return true;
            }
        }
        return false;
    }
}
