package com.medistock.controller;

import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.Report;
import com.medistock.entity.StockLog;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.ReportRepository;
import com.medistock.repository.StockLogRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
public class ReportController {

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final StockLogRepository stockLogRepository;
    private final UserRepository userRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ReportRepository reportRepository;
    private final AuditService auditService;

    public ReportController(InventoryRepository inventoryRepository,
                            MedicineRepository medicineRepository,
                            SupplierRepository supplierRepository,
                            StockLogRepository stockLogRepository,
                            UserRepository userRepository,
                            PurchaseOrderRepository purchaseOrderRepository,
                            ReportRepository reportRepository,
                            AuditService auditService) {
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.supplierRepository = supplierRepository;
        this.stockLogRepository = stockLogRepository;
        this.userRepository = userRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.reportRepository = reportRepository;
        this.auditService = auditService;
    }

    @GetMapping("/types")
    public List<Map<String, String>> types() {
        return List.of(
                Map.of("type", "stock", "name", "Stock on hand"),
                Map.of("type", "expiry", "name", "Expiry status"),
                Map.of("type", "movements", "name", "Stock movements"),
                Map.of("type", "users", "name", "User directory"),
                Map.of("type", "orders", "name", "Purchase orders"),
                Map.of("type", "low-stock", "name", "Low stock items"));
    }

    @GetMapping("/{type}.csv")
    public ResponseEntity<byte[]> downloadCsv(
            @PathVariable String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            Authentication authentication) {

        String csv;
        String label;

        switch (type) {
            case "stock" -> { csv = stockCsv(); label = "Stock on hand"; }
            case "expiry" -> { csv = expiryCsv(); label = "Expiry status"; }
            case "movements" -> { csv = movementsCsv(from, to); label = "Stock movements"; }
            case "users" -> { csv = usersCsv(); label = "User directory"; }
            case "orders" -> { csv = ordersCsv(from, to); label = "Purchase orders"; }
            case "low-stock" -> { csv = lowStockCsv(); label = "Low stock items"; }
            default -> throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Unknown report type: " + type);
        }

        Long userId = userRepository.findByEmail(authentication.getName())
                .map(User::getUserId)
                .orElse(null);

        Report report = new Report();
        report.setReportType(type);
        report.setGeneratedBy(userId);
        report.setFilePath("generated/" + type + "-" + LocalDate.now() + ".csv");
        reportRepository.save(report);

        auditService.record("REPORT_GENERATED", "REPORT", report.getReportId(),
                "Generated " + label + " CSV");

        String filename = "medistock-" + type + "-" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    // ---------- CSV builders ----------

    private String stockCsv() {
        Map<Long, Medicine> medicines = medicineMap();
        Map<Long, Supplier> suppliers = supplierMap();

        StringBuilder sb = new StringBuilder(
                "inventory_id,medicine,category,batch,quantity,minimum_stock,"
                        + "unit_price,stock_value,supplier,expiry_date\n");

        for (Inventory item : inventoryRepository.findAll()) {
            Medicine med = medicines.get(item.getMedicineId());
            Supplier sup = item.getSupplierId() == null
                    ? null : suppliers.get(item.getSupplierId());
            BigDecimal value = item.getUnitPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));

            sb.append(csv(
                    item.getInventoryId(),
                    med == null ? "" : med.getMedicineName(),
                    med == null ? "" : nullSafe(med.getCategory()),
                    item.getBatchNumber(),
                    item.getQuantity(),
                    item.getMinimumStock(),
                    item.getUnitPrice(),
                    value,
                    sup == null ? "" : sup.getSupplierName(),
                    item.getExpiryDate() == null ? "" : item.getExpiryDate().format(DATE)
            )).append('\n');
        }
        return sb.toString();
    }

    private String expiryCsv() {
        Map<Long, Medicine> medicines = medicineMap();
        LocalDate today = LocalDate.now();

        StringBuilder sb = new StringBuilder(
                "inventory_id,medicine,batch,expiry_date,status,quantity\n");

        List<Inventory> items = inventoryRepository.findAll().stream()
                .sorted((a, b) -> a.getExpiryDate().compareTo(b.getExpiryDate()))
                .toList();

        for (Inventory item : items) {
            Medicine med = medicines.get(item.getMedicineId());
            String status = expiryStatus(item.getExpiryDate(), today);

            sb.append(csv(
                    item.getInventoryId(),
                    med == null ? "" : med.getMedicineName(),
                    item.getBatchNumber(),
                    item.getExpiryDate() == null ? "" : item.getExpiryDate().format(DATE),
                    status,
                    item.getQuantity()
            )).append('\n');
        }
        return sb.toString();
    }

    private String lowStockCsv() {
        Map<Long, Medicine> medicines = medicineMap();

        StringBuilder sb = new StringBuilder(
                "inventory_id,medicine,batch,quantity,minimum_stock,shortfall\n");

        for (Inventory item : inventoryRepository.findLowStockItems()) {
            Medicine med = medicines.get(item.getMedicineId());
            int shortfall = Math.max(0, item.getMinimumStock() - item.getQuantity());

            sb.append(csv(
                    item.getInventoryId(),
                    med == null ? "" : med.getMedicineName(),
                    item.getBatchNumber(),
                    item.getQuantity(),
                    item.getMinimumStock(),
                    shortfall
            )).append('\n');
        }
        return sb.toString();
    }

    private String movementsCsv(String from, String to) {
        Map<Long, Medicine> medicines = medicineMap();
        Map<Long, Inventory> inventoryMap = new HashMap<>();
        inventoryRepository.findAll()
                .forEach(i -> inventoryMap.put(i.getInventoryId(), i));

        Map<Long, String> users = new HashMap<>();
        userRepository.findAll()
                .forEach(u -> users.put(u.getUserId(), u.getEmail()));

        LocalDate fromDate = parseDate(from);
        LocalDate toDate = parseDate(to);

        StringBuilder sb = new StringBuilder(
                "stock_log_id,changed_at,medicine,batch,movement_type,"
                        + "change_quantity,user,notes\n");

        for (StockLog log : stockLogRepository.findAllByOrderByChangedAtDesc()) {
            LocalDate changed = log.getChangedAt() == null
                    ? null : log.getChangedAt().toLocalDate();

            if (fromDate != null && (changed == null || changed.isBefore(fromDate))) {
                continue;
            }
            if (toDate != null && (changed == null || changed.isAfter(toDate))) {
                continue;
            }

            Inventory item = inventoryMap.get(log.getInventoryId());
            Medicine med = item == null
                    ? null : medicines.get(item.getMedicineId());

            sb.append(csv(
                    log.getStockLogId(),
                    log.getChangedAt() == null ? "" : log.getChangedAt().toString(),
                    med == null ? "" : med.getMedicineName(),
                    item == null ? "" : item.getBatchNumber(),
                    log.getMovementType(),
                    log.getChangeQuantity(),
                    log.getUserId() == null
                            ? "" : users.getOrDefault(log.getUserId(), ""),
                    nullSafe(log.getNotes())
            )).append('\n');
        }
        return sb.toString();
    }

    private String usersCsv() {
        StringBuilder sb = new StringBuilder(
                "user_id,full_name,email,role,active,created_at\n");

        for (User user : userRepository.findAll()) {
            sb.append(csv(
                    user.getUserId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole().getRoleName(),
                    Boolean.TRUE.equals(user.getActive()) ? "yes" : "no",
                    user.getCreatedAt() == null ? "" : user.getCreatedAt().toString()
            )).append('\n');
        }
        return sb.toString();
    }

    private String ordersCsv(String from, String to) {
        Map<Long, Supplier> suppliers = supplierMap();
        Map<Long, String> users = new HashMap<>();
        userRepository.findAll()
                .forEach(u -> users.put(u.getUserId(), u.getEmail()));

        LocalDate fromDate = parseDate(from);
        LocalDate toDate = parseDate(to);

        StringBuilder sb = new StringBuilder(
                "purchase_order_id,order_date,supplier,status,total_amount,created_by\n");

        for (PurchaseOrder order : purchaseOrderRepository.findAllByOrderByOrderDateDesc()) {
            LocalDate orderDate = order.getOrderDate();

            if (fromDate != null && (orderDate == null || orderDate.isBefore(fromDate))) {
                continue;
            }
            if (toDate != null && (orderDate == null || orderDate.isAfter(toDate))) {
                continue;
            }

            Supplier sup = suppliers.get(order.getSupplierId());

            sb.append(csv(
                    order.getPurchaseOrderId(),
                    orderDate == null ? "" : orderDate.format(DATE),
                    sup == null ? "" : sup.getSupplierName(),
                    order.getStatus(),
                    order.getTotalAmount(),
                    order.getCreatedBy() == null
                            ? "" : users.getOrDefault(order.getCreatedBy(), "")
            )).append('\n');
        }
        return sb.toString();
    }

    // ---------- helpers ----------

    private Map<Long, Medicine> medicineMap() {
        Map<Long, Medicine> map = new HashMap<>();
        medicineRepository.findAll().forEach(m -> map.put(m.getMedicineId(), m));
        return map;
    }

    private Map<Long, Supplier> supplierMap() {
        Map<Long, Supplier> map = new HashMap<>();
        supplierRepository.findAll().forEach(s -> map.put(s.getSupplierId(), s));
        return map;
    }

    private static String expiryStatus(LocalDate expiry, LocalDate today) {
        if (expiry == null) return "UNKNOWN";
        if (expiry.isBefore(today)) return "EXPIRED";
        if (!expiry.isAfter(today.plusDays(30))) return "EXPIRING_SOON";
        return "SAFE";
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Dates must be in YYYY-MM-DD format");
        }
    }

    private static String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private static String csv(Object... cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            String value = cells[i] == null ? "" : cells[i].toString();
            if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
                sb.append('"').append(value.replace("\"", "\"\"")).append('"');
            } else {
                sb.append(value);
            }
        }
        return sb.toString();
    }
}
