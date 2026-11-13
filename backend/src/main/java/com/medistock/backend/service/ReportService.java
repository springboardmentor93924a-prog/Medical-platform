package com.medistock.backend.service;

import com.medistock.backend.dto.InventoryDtos.InventoryRow;
import com.medistock.backend.dto.ReportDtos.ReportResponse;
import com.medistock.backend.entity.OrderStatus;
import com.medistock.backend.entity.PurchaseOrder;
import com.medistock.backend.entity.StockLog;
import com.medistock.backend.entity.Supplier;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.PurchaseOrderRepository;
import com.medistock.backend.repository.StockLogRepository;
import com.medistock.backend.repository.SupplierRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {
    // These three are for the Admin only
    private static final Set<String> ADMIN_ONLY = Set.of("analytics", "suppliers", "movements");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final InventoryService inventory;
    private final PurchaseOrderRepository orders;
    private final SupplierRepository suppliers;
    private final StockLogRepository logs;
    private final WastageService wastage;

    public ReportService(InventoryService inventory, PurchaseOrderRepository orders,
                         SupplierRepository suppliers, StockLogRepository logs, WastageService wastage) {
        this.inventory = inventory; this.orders = orders; this.suppliers = suppliers; this.logs = logs; this.wastage = wastage;
    }

    @Transactional(readOnly = true)
    public ReportResponse build(String type) {
        String t = type.toLowerCase();
        if (ADMIN_ONLY.contains(t) && !isAdmin()) throw new AccessDeniedException("Admin only");
        return switch (t) {
            case "inventory" -> inventoryReport();
            case "stock" -> stockReport();
            case "expiry" -> expiryReport();
            case "purchases" -> purchaseReport();
            case "analytics" -> analyticsReport();
            case "suppliers" -> supplierReport();
            case "movements" -> movementReport();
            case "wastage" -> wastageReport();
            default -> throw new ApiException(HttpStatus.BAD_REQUEST,
                "Unknown report type. Use inventory, stock, expiry, purchases, wastage, analytics, suppliers or movements");
        };
    }

    private static boolean isAdmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private List<InventoryRow> allRows() { return inventory.list(null, null, null, null, null); }

    private ReportResponse inventoryReport() {
        List<List<String>> rows = allRows().stream()
            .map(r -> row(r.name(), r.batchNumber(), r.category(), r.supplier(), r.quantity(), r.expiryDate(), money(r.price())))
            .toList();
        return report("inventory", "Inventory report",
            List.of("Medicine", "Batch", "Category", "Supplier", "Qty", "Expiry", "Price (Rs)"), rows);
    }

    private ReportResponse stockReport() {
        List<List<String>> rows = allRows().stream()
            .map(r -> row(r.name(), r.batchNumber(), r.quantity(), r.reorderLevel(), r.stockStatus()))
            .toList();
        return report("stock", "Stock data", List.of("Medicine", "Batch", "Qty", "Reorder level", "Status"), rows);
    }

    /** Batches that are expired or near expiry and still have stock on hand. */
    private ReportResponse expiryReport() {
        List<List<String>> rows = allRows().stream()
            .filter(r -> !r.expiryStatus().equals("Safe") && r.quantity() > 0)
            .sorted((a, b) -> Long.compare(a.daysToExpiry(), b.daysToExpiry()))
            .map(r -> row(r.name(), r.batchNumber(), r.quantity(), r.expiryDate(), r.daysToExpiry(), r.expiryStatus()))
            .toList();
        return report("expiry", "Expiry report (stock on hand)",
            List.of("Medicine", "Batch", "Qty", "Expiry", "Days left", "Status"), rows);
    }

    private ReportResponse purchaseReport() {
        List<List<String>> rows = orders.findAllByOrderByCreatedAtDescIdDesc().stream().map(OrderService::toDto).map(o ->
            row(o.orderNumber(), o.supplier(),
                o.items().stream().map(i -> i.medicine() + " x " + i.quantity()).collect(Collectors.joining("; ")),
                money(o.totalAmount()), day(o.createdAt()), o.expectedDate() == null ? "-" : o.expectedDate(),
                day(o.deliveredAt()), o.status())).toList();
        return report("purchases", "Purchase history",
            List.of("Order", "Supplier", "Medicines", "Total (Rs)", "Ordered", "Expected", "Delivered", "Status"), rows);
    }

    /** Inventory analytics: one line per category, plus a total. Counts of expired and expiring batches only include batches with stock. */
    private ReportResponse analyticsReport() {
        Map<String, List<InventoryRow>> byCategory = allRows().stream()
            .collect(Collectors.groupingBy(InventoryRow::category, TreeMap::new, Collectors.toList()));
        List<List<String>> out = new ArrayList<>();
        long tMeds = 0, tBatches = 0, tUnits = 0, tReorder = 0, tExpired = 0, tNear = 0;
        BigDecimal tValue = BigDecimal.ZERO;
        for (var entry : byCategory.entrySet()) {
            List<InventoryRow> rows = entry.getValue();
            Map<Long, List<InventoryRow>> byMedicine = rows.stream().collect(Collectors.groupingBy(InventoryRow::medicineId));
            long reorder = byMedicine.values().stream().filter(group -> {
                int usable = group.stream().filter(r -> r.daysToExpiry() >= 0).mapToInt(InventoryRow::quantity).sum();
                return usable <= group.get(0).reorderLevel();   // out of stock or low stock
            }).count();
            long units = rows.stream().mapToLong(InventoryRow::quantity).sum();
            BigDecimal value = rows.stream().map(r -> r.price().multiply(BigDecimal.valueOf(r.quantity()))).reduce(BigDecimal.ZERO, BigDecimal::add);
            long expired = rows.stream().filter(r -> r.quantity() > 0 && r.daysToExpiry() < 0).count();
            long near = rows.stream().filter(r -> r.quantity() > 0 && r.daysToExpiry() >= 0 && r.daysToExpiry() <= 90).count();
            out.add(row(entry.getKey(), byMedicine.size(), rows.size(), units, money(value), reorder, expired, near));
            tMeds += byMedicine.size(); tBatches += rows.size(); tUnits += units; tReorder += reorder;
            tExpired += expired; tNear += near; tValue = tValue.add(value);
        }
        out.add(row("TOTAL", tMeds, tBatches, tUnits, money(tValue), tReorder, tExpired, tNear));
        return report("analytics", "Inventory analytics by category",
            List.of("Category", "Medicines", "Batches", "Units", "Stock value (Rs)", "Needs reorder",
                "Expired (with stock)", "Expiring in 90 days (with stock)"), out);
    }

    /** Supplier analytics. On-time % = received orders delivered on or before the expected date. */
    private ReportResponse supplierReport() {
        List<InventoryRow> rows = allRows();
        List<PurchaseOrder> allOrders = orders.findAll();
        ZoneId zone = ZoneId.systemDefault();
        List<List<String>> out = new ArrayList<>();
        for (Supplier s : suppliers.findAll(Sort.by("name"))) {
            long medicines = rows.stream().filter(r -> r.supplierId().equals(s.getId())).map(InventoryRow::medicineId).distinct().count();
            List<PurchaseOrder> mine = allOrders.stream().filter(o -> o.getSupplier().getId().equals(s.getId())).toList();
            List<PurchaseOrder> received = mine.stream().filter(o -> o.getStatus() == OrderStatus.RECEIVED).toList();
            BigDecimal spent = mine.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.REJECTED
                          && o.getStatus() != OrderStatus.AWAITING_APPROVAL)
                .flatMap(o -> o.getItems().stream())
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            List<PurchaseOrder> timed = received.stream().filter(o -> o.getExpectedDate() != null && o.getDeliveredAt() != null).toList();
            String onTime = timed.isEmpty() ? "-" : String.valueOf(Math.round(100.0 * timed.stream()
                .filter(o -> !o.getDeliveredAt().atZone(zone).toLocalDate().isAfter(o.getExpectedDate())).count() / timed.size()));
            List<PurchaseOrder> delivered = received.stream().filter(o -> o.getDeliveredAt() != null).toList();
            String avgDays = delivered.isEmpty() ? "-" : String.format(Locale.ROOT, "%.1f", delivered.stream()
                .mapToDouble(o -> Duration.between(o.getCreatedAt(), o.getDeliveredAt()).toHours() / 24.0).average().orElse(0));
            out.add(row(s.getName(), s.isActive() ? "Yes" : "No", medicines, mine.size(), received.size(), money(spent), onTime, avgDays));
        }
        return report("suppliers", "Supplier analytics",
            List.of("Supplier", "Active", "Medicines", "Orders placed", "Orders received", "Total spent (Rs)", "On-time %", "Avg delivery days"), out);
    }

    /** Stock lost to expiry, damage, theft or other reasons, valued at the batch price. */
    private ReportResponse wastageReport() {
        List<List<String>> rows = wastage.rows().stream().map(w -> row(WHEN.format(LocalDateTime.ofInstant(w.time(), ZoneId.systemDefault())),
            w.medicine(), w.batchNumber(), w.reason(), w.quantity(), money(w.value()), w.note() == null ? "-" : w.note(), w.by())).toList();
        return report("wastage", "Wastage report", List.of("When", "Medicine", "Batch", "Reason", "Qty lost", "Value lost (Rs)", "Note", "By"), rows);
    }

    /** The latest 200 stock movements, newest first. */
    private ReportResponse movementReport() {
        List<List<String>> rows = logs.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, 200)).stream().map(this::movementRow).toList();
        return report("movements", "Stock movement (latest 200)",
            List.of("When", "Medicine", "Batch", "Change", "Quantity after", "Type", "Note", "By"), rows);
    }

    private List<String> movementRow(StockLog l) {
        var b = l.getBatch();
        String type = l.getType().name().toLowerCase().replace('_', ' ');
        return row(WHEN.format(LocalDateTime.ofInstant(l.getCreatedAt(), ZoneId.systemDefault())), b.getMedicine().getName(),
            b.getBatchNumber(), l.getChangeQuantity(), l.getQuantityAfter(), Character.toUpperCase(type.charAt(0)) + type.substring(1),
            l.getNote() == null ? "-" : l.getNote(), l.getPerformedBy() == null ? "System" : l.getPerformedBy().getUsername());
    }

    private static ReportResponse report(String type, String title, List<String> cols, List<List<String>> rows) {
        return new ReportResponse(type, title, Instant.now().toString(), cols, rows);
    }

    private static List<String> row(Object... cells) {
        return Arrays.stream(cells).map(String::valueOf).toList();
    }

    private static String money(BigDecimal v) { return v.setScale(2, RoundingMode.HALF_UP).toPlainString(); }
    private static String day(Instant t) { return t == null ? "-" : t.toString().substring(0, 10); }
}
