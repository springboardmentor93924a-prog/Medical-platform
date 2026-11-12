package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.service.NotificationScheduler;
import com.medistock.medistock_backend.dto.MedicineRequest;
import com.medistock.medistock_backend.dto.MedicineResponse;
import com.medistock.medistock_backend.entity.Medicine;
import com.medistock.medistock_backend.entity.StockLog;
import com.medistock.medistock_backend.entity.Supplier;
import com.medistock.medistock_backend.repository.MedicineRepository;
import com.medistock.medistock_backend.repository.StockLogRepository;
import com.medistock.medistock_backend.repository.SupplierRepository;
import com.medistock.medistock_backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_PHARMACIST', 'PHARMACIST', 'ROLE_STAFF', 'STAFF')")
public class AdminInventoryController {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final StockLogRepository stockLogRepository;
    private final AuditService auditService;
    private final NotificationScheduler notificationScheduler;

    // --- MEDICINES CRUD ---

    @GetMapping("/medicines")
    public ResponseEntity<List<MedicineResponse>> getAllMedicines() {
        List<MedicineResponse> list = medicineRepository.findAll().stream()
                .map(MedicineResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/medicines")
    public ResponseEntity<MedicineResponse> addMedicine(@RequestBody MedicineRequest request) {
        if (medicineRepository.existsByBatchNumber(request.getBatchNumber())) {
            throw new RuntimeException("Medicine with this batch number already exists");
        }

        Medicine medicine = new Medicine();
        medicine.setName(request.getName());
        medicine.setBatchNumber(request.getBatchNumber());
        medicine.setCategory(request.getCategory());
        medicine.setQuantity(request.getQuantity());
        medicine.setMinQuantity(request.getMinQuantity());
        medicine.setManufacturingDate(request.getManufacturingDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setUnitPrice(request.getUnitPrice());

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            medicine.setSupplier(supplier);
        }

        Medicine saved = medicineRepository.save(medicine);

        if (saved.getQuantity() > 0) {
            StockLog log = new StockLog(saved, saved.getQuantity(), "New Stock Added");
            stockLogRepository.save(log);
        }

        auditService.log("CREATE_MEDICINE", "MEDICINE", saved.getId(),
                "Created " + saved.getName() + " (batch " + saved.getBatchNumber() + ", qty " + saved.getQuantity() + ")");

        return ResponseEntity.ok(MedicineResponse.fromEntity(saved));
    }

    @PutMapping("/medicines/{id}")
    public ResponseEntity<MedicineResponse> updateMedicine(@PathVariable Long id, @RequestBody MedicineRequest request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        int oldQuantity = medicine.getQuantity();
        int newQuantity = request.getQuantity();

        medicine.setName(request.getName());
        medicine.setBatchNumber(request.getBatchNumber());
        medicine.setCategory(request.getCategory());
        medicine.setQuantity(newQuantity);
        medicine.setMinQuantity(request.getMinQuantity());
        medicine.setManufacturingDate(request.getManufacturingDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setUnitPrice(request.getUnitPrice());
        medicine.setUpdatedAt(LocalDateTime.now());

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            medicine.setSupplier(supplier);
        }

        Medicine saved = medicineRepository.save(medicine);

        int diff = newQuantity - oldQuantity;
        if (diff != 0) {
            String reason = diff > 0 ? "Inventory Restock" : "Inventory Adjustment";
            StockLog log = new StockLog(saved, diff, reason);
            stockLogRepository.save(log);
        }

        // FIXED: log AFTER save so 'saved' variable exists
        auditService.log("UPDATE_MEDICINE", "MEDICINE", saved.getId(),
                "Updated " + saved.getName() + " (qty " + oldQuantity + " → " + newQuantity + ")");

        return ResponseEntity.ok(MedicineResponse.fromEntity(saved));
    }

    @DeleteMapping("/medicines/{id}")
    public ResponseEntity<?> deleteMedicine(@PathVariable Long id) {
        try {
            if (!medicineRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Medicine not found"));
            }
            auditService.log("DELETE_MEDICINE", "MEDICINE", id, "Deleted medicine ID " + id);
            medicineRepository.deleteById(id);
            return ResponseEntity.ok(java.util.Map.of("message", "Medicine deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Cannot delete medicine because it is linked to a Purchase Order."));
        }
    }

    // --- INVENTORY LOGS ---

    @GetMapping("/stock-logs")
    public ResponseEntity<?> getStockLogs() {
        return ResponseEntity.ok(stockLogRepository.findAllByOrderByTimestampDesc());
    }

    // --- DASHBOARD STATS ---

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            List<Medicine> allMeds = medicineRepository.findAll();
            LocalDate today = LocalDate.now();

            long inStock = 0;
            long lowStock = 0;
            long outOfStock = 0;
            long expired = 0;

            for (Medicine m : allMeds) {
                if (m.getExpiryDate() != null && m.getExpiryDate().isBefore(today)) {
                    expired++;
                } else if (m.getQuantity() == 0) {
                    outOfStock++;
                } else if (m.getQuantity() <= m.getMinQuantity()) {
                    lowStock++;
                } else {
                    inStock++;
                }
            }

            double totalValue = allMeds.stream()
                    .mapToDouble(m -> m.getQuantity() * (m.getUnitPrice() != null ? m.getUnitPrice() : 0.0))
                    .sum();

            return ResponseEntity.ok(Map.of(
                    "totalMedicines", allMeds.size(),
                    "inStockCount", inStock,
                    "lowStockCount", lowStock,
                    "outOfStockCount", outOfStock,
                    "expiredCount", expired,
                    "totalInventoryValue", Math.round(totalValue * 100.0) / 100.0
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // --- EXPIRY TRACKING ---

    @GetMapping("/expiring")
    public ResponseEntity<List<MedicineResponse>> getExpiringMedicines() {
        LocalDate alertDate = LocalDate.now().plusDays(60);

        List<MedicineResponse> expiring = medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null && m.getExpiryDate().isBefore(alertDate))
                .map(MedicineResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(expiring);
    }

    // --- DASHBOARD CHART DATA ---

    @GetMapping("/dashboard-categories")
    public ResponseEntity<?> getCategoryStats() {
        try {
            List<Medicine> allMeds = medicineRepository.findAll();

            Map<String, Long> categoryCounts = allMeds.stream()
                    .filter(m -> m.getCategory() != null && !m.getCategory().trim().isEmpty())
                    .collect(Collectors.groupingBy(Medicine::getCategory, Collectors.counting()));

            List<Map<String, Object>> chartData = categoryCounts.entrySet().stream()
                    .map(entry -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("name", entry.getKey());
                        map.put("count", entry.getValue());
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate category stats: " + e.getMessage()));
        }
    }

    // --- CATEGORIES ---
    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getAllCategories() {
        List<Medicine> allMeds = medicineRepository.findAll();

        Map<String, List<Medicine>> grouped = allMeds.stream()
                .filter(m -> m.getCategory() != null && !m.getCategory().trim().isEmpty())
                .collect(Collectors.groupingBy(Medicine::getCategory));

        List<Map<String, Object>> response = new ArrayList<>();
        int idCounter = 1;

        for (Map.Entry<String, List<Medicine>> entry : grouped.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", idCounter++);
            map.put("name", entry.getKey());
            map.put("description", entry.getValue().size() + " medicines assigned to this category.");
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/categories")
    public ResponseEntity<?> addCategory(@RequestBody Map<String, String> request) {
        auditService.log("CREATE_CATEGORY", "CATEGORY", null,
                "Category: " + request.get("name"));
        return ResponseEntity.ok(Map.of("message", "Category saved successfully"));
    }

    @PutMapping("/categories/{oldName}")
    public ResponseEntity<String> updateCategory(@PathVariable String oldName, @RequestParam String newName) {
        List<Medicine> medicines = medicineRepository.findAll().stream()
                .filter(m -> oldName.equals(m.getCategory()))
                .collect(Collectors.toList());

        for (Medicine m : medicines) {
            m.setCategory(newName);
            medicineRepository.save(m);
        }

        auditService.log("UPDATE_CATEGORY", "CATEGORY", null,
                "Renamed '" + oldName + "' → '" + newName + "' (" + medicines.size() + " medicines)");

        return ResponseEntity.ok("Category updated across " + medicines.size() + " medicines");
    }

    @DeleteMapping("/categories/{name}")
    public ResponseEntity<String> deleteCategory(@PathVariable String name) {
        List<Medicine> medicines = medicineRepository.findAll().stream()
                .filter(m -> name.equals(m.getCategory()))
                .collect(Collectors.toList());

        for (Medicine m : medicines) {
            m.setCategory("Uncategorized");
            medicineRepository.save(m);
        }

        auditService.log("DELETE_CATEGORY", "CATEGORY", null,
                "Deleted '" + name + "' (" + medicines.size() + " medicines moved to Uncategorized)");

        return ResponseEntity.ok("Category deleted and medicines moved to Uncategorized");
    }

    // ==========================================
    // FEFO — First Expiry First Out
    // ==========================================

    /**
     * Returns all batches of a given medicine name, sorted by expiry date ascending.
     * Used by Billing/POS to show the pharmacist which batches to prioritize.
     */
    @GetMapping("/medicines/fefo/{name}")
    public ResponseEntity<?> getBatchesForFEFO(@PathVariable String name) {
        try {
            // Fetch ALL batches (including 0 quantity) so the modal can show the full picture
            List<Medicine> allBatches = medicineRepository.findAll().stream()
                    .filter(m -> m.getName() != null
                            && m.getName().trim().equalsIgnoreCase(name.trim()))
                    .sorted((a, b) -> {
                        // Sort by expiry (soonest first). Nulls go last.
                        if (a.getExpiryDate() == null) return 1;
                        if (b.getExpiryDate() == null) return -1;
                        return a.getExpiryDate().compareTo(b.getExpiryDate());
                    })
                    .collect(Collectors.toList());

            LocalDate today = LocalDate.now();

            List<Map<String, Object>> response = allBatches.stream().map(m -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", m.getId());
                row.put("batchNumber", m.getBatchNumber());
                row.put("expiryDate", m.getExpiryDate());
                row.put("quantity", m.getQuantity() != null ? m.getQuantity() : 0);
                row.put("unitPrice", m.getUnitPrice());
                row.put("isExpired", m.getExpiryDate() != null && m.getExpiryDate().isBefore(today));
                row.put("isOutOfStock", m.getQuantity() == null || m.getQuantity() == 0);
                row.put("daysUntilExpiry", m.getExpiryDate() != null
                        ? java.time.temporal.ChronoUnit.DAYS.between(today, m.getExpiryDate())
                        : null);
                return row;
            }).collect(Collectors.toList());

            int totalAvailable = allBatches.stream()
                    .mapToInt(m -> m.getQuantity() != null ? m.getQuantity() : 0)
                    .sum();

            return ResponseEntity.ok(Map.of(
                    "medicineName", name,
                    "totalBatches", allBatches.size(),
                    "totalAvailable", totalAvailable,
                    "batches", response
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Dispenses a specified quantity of a medicine using FEFO logic.
     * Automatically splits the requested quantity across batches (oldest expiry first).
     * Body: { "quantity": 50, "reason": "Sale to customer" }
     */
    @PostMapping("/medicines/{id}/dispense-fefo")
    public ResponseEntity<?> dispenseFEFO(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Medicine rootMedicine = medicineRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));

            int requestedQty = Integer.parseInt(body.get("quantity").toString());
            String reason = body.getOrDefault("reason", "Sale").toString();

            if (requestedQty <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Quantity must be > 0"));
            }

            // Get all batches of the same medicine name, sorted by expiry (FEFO)
            List<Medicine> batches = medicineRepository.findAll().stream()
                    .filter(m -> m.getName().equalsIgnoreCase(rootMedicine.getName()))
                    .filter(m -> m.getQuantity() != null && m.getQuantity() > 0)
                    .sorted((a, b) -> {
                        if (a.getExpiryDate() == null) return 1;
                        if (b.getExpiryDate() == null) return -1;
                        return a.getExpiryDate().compareTo(b.getExpiryDate());
                    })
                    .collect(Collectors.toList());

            int totalAvailable = batches.stream().mapToInt(Medicine::getQuantity).sum();
            if (totalAvailable < requestedQty) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Insufficient stock. Available: " + totalAvailable + ", Requested: " + requestedQty
                ));
            }

            // Allocate across batches
            int remaining = requestedQty;
            List<Map<String, Object>> allocations = new ArrayList<>();

            for (Medicine batch : batches) {
                if (remaining <= 0) break;

                int takeFromBatch = Math.min(batch.getQuantity(), remaining);
                int newQty = batch.getQuantity() - takeFromBatch;

                batch.setQuantity(newQty);
                batch.setUpdatedAt(LocalDateTime.now());
                medicineRepository.save(batch);

                // Stock log
                StockLog log = new StockLog(batch, -takeFromBatch,
                        reason + " (FEFO, batch " + batch.getBatchNumber() + ")");
                stockLogRepository.save(log);

                Map<String, Object> alloc = new HashMap<>();
                alloc.put("batchNumber", batch.getBatchNumber());
                alloc.put("expiryDate", batch.getExpiryDate());
                alloc.put("deducted", takeFromBatch);
                alloc.put("remainingInBatch", newQty);
                allocations.add(alloc);

                remaining -= takeFromBatch;
            }

            // Audit log (Phase 1 integration)
            auditService.log("DISPENSE_FEFO", "MEDICINE", id,
                    "Dispensed " + requestedQty + " units of " + rootMedicine.getName()
                            + " across " + allocations.size() + " batch(es) using FEFO");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "medicineName", rootMedicine.getName(),
                    "requestedQuantity", requestedQty,
                    "batchesUsed", allocations.size(),
                    "allocations", allocations
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/send-low-stock-alert")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> triggerLowStockAlert() {
        try {
            int count = notificationScheduler.sendLowStockDigestNow();
            return ResponseEntity.ok(Map.of(
                    "message", "Low stock alert sent",
                    "itemsIncluded", count
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/send-expiry-alert")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> triggerExpiryAlert() {
        int count = notificationScheduler.sendExpiryWarningDigestNow();
        return ResponseEntity.ok(Map.of("message", "Expiry alert sent", "itemsIncluded", count));
    }


    // ==========================================
    // WASTAGE REPORT — Get all wastage metrics
    // ==========================================
    @GetMapping("/reports/wastage")
    public ResponseEntity<?> getWastageReport() {
        try {
            List<Medicine> all = medicineRepository.findAll();
            LocalDate today = LocalDate.now();
            LocalDate nearExpiryDate = today.plusDays(45);

            // Categorize
            List<Medicine> expired = new ArrayList<>();
            List<Medicine> nearExpiry = new ArrayList<>();
            List<Medicine> damaged = new ArrayList<>();

            for (Medicine m : all) {
                boolean flagged = Boolean.TRUE.equals(m.getWastageFlag());
                boolean isExpired = m.getExpiryDate() != null && m.getExpiryDate().isBefore(today);
                boolean isNearExpiry = m.getExpiryDate() != null
                        && !isExpired
                        && m.getExpiryDate().isBefore(nearExpiryDate);

                if (isExpired || (flagged && !isExpired)) {
                    expired.add(m); // count under "loss"
                }
                if (isNearExpiry) {
                    nearExpiry.add(m);
                }
                if (flagged) {
                    damaged.add(m);
                }
            }

            // Calculate loss values
            double expiredLoss = expired.stream()
                    .filter(m -> m.getQuantity() != null && m.getUnitPrice() != null)
                    .mapToDouble(m -> m.getQuantity() * m.getUnitPrice())
                    .sum();

            double nearExpiryRisk = nearExpiry.stream()
                    .filter(m -> m.getQuantity() != null && m.getUnitPrice() != null)
                    .mapToDouble(m -> m.getQuantity() * m.getUnitPrice())
                    .sum();

            // Breakdown by reason
            Map<String, Double> lossByReason = new HashMap<>();
            for (Medicine m : expired) {
                String reason;
                if (Boolean.TRUE.equals(m.getWastageFlag()) && m.getWastageReason() != null) {
                    reason = m.getWastageReason();
                } else {
                    reason = "EXPIRED";
                }
                double loss = (m.getQuantity() != null && m.getUnitPrice() != null)
                        ? m.getQuantity() * m.getUnitPrice()
                        : 0.0;
                lossByReason.merge(reason, loss, Double::sum);
            }

            List<Map<String, Object>> reasonChart = lossByReason.entrySet().stream()
                    .map(e -> {
                        Map<String, Object> row = new HashMap<>();
                        row.put("reason", e.getKey());
                        row.put("loss", Math.round(e.getValue() * 100.0) / 100.0);
                        return row;
                    })
                    .collect(Collectors.toList());

            // Monthly trend (last 6 months, based on wastedAt or expiryDate)
            List<Map<String, Object>> monthlyTrend = new ArrayList<>();
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MMM yyyy");
            for (int i = 5; i >= 0; i--) {
                LocalDate monthStart = today.withDayOfMonth(1).minusMonths(i);
                LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
                LocalDate finalMonthStart = monthStart;
                LocalDate finalMonthEnd = monthEnd;

                double loss = expired.stream()
                        .filter(m -> {
                            LocalDate ref = m.getWastedAt() != null
                                    ? m.getWastedAt().toLocalDate()
                                    : m.getExpiryDate();
                            return ref != null
                                    && !ref.isBefore(finalMonthStart)
                                    && !ref.isAfter(finalMonthEnd);
                        })
                        .filter(m -> m.getQuantity() != null && m.getUnitPrice() != null)
                        .mapToDouble(m -> m.getQuantity() * m.getUnitPrice())
                        .sum();

                Map<String, Object> row = new HashMap<>();
                row.put("month", monthStart.format(fmt));
                row.put("loss", Math.round(loss * 100.0) / 100.0);
                monthlyTrend.add(row);
            }

            // Itemized list
            List<Map<String, Object>> items = expired.stream().map(m -> {
                        Map<String, Object> row = new HashMap<>();
                        row.put("id", m.getId());
                        row.put("name", m.getName());
                        row.put("batchNumber", m.getBatchNumber());
                        row.put("quantity", m.getQuantity());
                        row.put("unitPrice", m.getUnitPrice());
                        row.put("expiryDate", m.getExpiryDate());
                        row.put("totalLoss", (m.getQuantity() != null && m.getUnitPrice() != null)
                                ? Math.round(m.getQuantity() * m.getUnitPrice() * 100.0) / 100.0
                                : 0.0);
                        row.put("reason", Boolean.TRUE.equals(m.getWastageFlag()) && m.getWastageReason() != null
                                ? m.getWastageReason()
                                : "EXPIRED");
                        row.put("flagged", Boolean.TRUE.equals(m.getWastageFlag()));
                        return row;
                    }).sorted((a, b) -> Double.compare((Double) b.get("totalLoss"), (Double) a.get("totalLoss")))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "totalLoss", Math.round(expiredLoss * 100.0) / 100.0,
                    "expiredCount", expired.size(),
                    "damagedCount", damaged.size(),
                    "nearExpiryCount", nearExpiry.size(),
                    "nearExpiryRisk", Math.round(nearExpiryRisk * 100.0) / 100.0,
                    "lossByReason", reasonChart,
                    "monthlyTrend", monthlyTrend,
                    "items", items
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // FLAG a medicine as wasted
    // ==========================================
    @PutMapping("/medicines/{id}/flag-wastage")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_STAFF', 'STAFF')")
    public ResponseEntity<?> flagWastage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Medicine med = medicineRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));

            String reason = body.getOrDefault("reason", "DAMAGED").toUpperCase();
            if (!List.of("EXPIRED", "DAMAGED", "RECALLED", "CONTAMINATED").contains(reason)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid reason"));
            }

            med.setWastageFlag(true);
            med.setWastageReason(reason);
            med.setWastedAt(LocalDateTime.now());
            medicineRepository.save(med);

            auditService.log("FLAG_WASTAGE", "MEDICINE", id,
                    "Flagged " + med.getName() + " as " + reason);

            return ResponseEntity.ok(Map.of("message", "Marked as wasted (" + reason + ")"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // UNFLAG a medicine (undo)
    // ==========================================
    @PutMapping("/medicines/{id}/unflag-wastage")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> unflagWastage(@PathVariable Long id) {
        try {
            Medicine med = medicineRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));

            med.setWastageFlag(false);
            med.setWastageReason(null);
            med.setWastedAt(null);
            medicineRepository.save(med);

            auditService.log("UNFLAG_WASTAGE", "MEDICINE", id, "Removed wastage flag from " + med.getName());

            return ResponseEntity.ok(Map.of("message", "Wastage flag removed"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}