package com.medistock.dto;

import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.StockLog;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.NotificationRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.StockLogRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Aggregates all dashboard KPI and chart data in one place. */
@Service
public class DashboardStats {

    private static final DateTimeFormatter MONTH =
            DateTimeFormatter.ofPattern("yyyy-MM");

    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;
    private final StockLogRepository stockLogRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final NotificationRepository notificationRepository;

    public DashboardStats(MedicineRepository medicineRepository,
                          InventoryRepository inventoryRepository,
                          StockLogRepository stockLogRepository,
                          PurchaseOrderRepository purchaseOrderRepository,
                          UserRepository userRepository,
                          SupplierRepository supplierRepository,
                          NotificationRepository notificationRepository) {
        this.medicineRepository = medicineRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockLogRepository = stockLogRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.notificationRepository = notificationRepository;
    }

    public Response compute() {
        LocalDate today = LocalDate.now();
        LocalDate expiryHorizon = today.plusDays(30);

        List<Medicine> medicines = medicineRepository.findAll();
        List<Inventory> inventory = inventoryRepository.findAll();
        Map<Long, Medicine> medicineById = new HashMap<>();
        medicines.forEach(m -> medicineById.put(m.getMedicineId(), m));
        Map<Long, Supplier> supplierById = new HashMap<>();
        supplierRepository.findAll()
                .forEach(s -> supplierById.put(s.getSupplierId(), s));

        // ---- KPIs ----
        long totalUnits = 0;
        BigDecimal stockValue = BigDecimal.ZERO;
        int lowStock = 0;
        int expiringSoon = 0;
        int expired = 0;
        int healthy = 0;

        Map<String, Long> categoryQty = new LinkedHashMap<>();
        Map<String, Long> supplierQty = new LinkedHashMap<>();

        for (Inventory item : inventory) {
            totalUnits += item.getQuantity();
            stockValue = stockValue.add(
                    item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));

            if (item.getQuantity() <= item.getMinimumStock()) {
                lowStock++;
            }

            String bucket;
            if (item.getExpiryDate() == null) {
                bucket = "UNKNOWN";
            } else if (item.getExpiryDate().isBefore(today)) {
                bucket = "EXPIRED";
            } else if (!item.getExpiryDate().isAfter(expiryHorizon)) {
                bucket = "EXPIRING";
            } else {
                bucket = "OK";
            }

            switch (bucket) {
                case "EXPIRED" -> expired++;
                case "EXPIRING" -> expiringSoon++;
                case "OK" -> healthy++;
                default -> { }
            }

            Medicine med = medicineById.get(item.getMedicineId());
            String category = med == null || med.getCategory() == null
                    ? "Uncategorised" : med.getCategory();
            categoryQty.merge(category, (long) item.getQuantity(), Long::sum);

            String supplierName = item.getSupplierId() == null
                    ? "Unknown"
                    : supplierById.containsKey(item.getSupplierId())
                            ? supplierById.get(item.getSupplierId()).getSupplierName()
                            : "Unknown";
            supplierQty.merge(supplierName, (long) item.getQuantity(), Long::sum);
        }

        List<PurchaseOrder> orders = purchaseOrderRepository
                .findAllByOrderByOrderDateDesc();
        long pendingOrders = orders.stream()
                .filter(o -> "PENDING".equalsIgnoreCase(o.getStatus()))
                .count();

        List<User> users = userRepository.findAll();
        long activeUsers = users.stream()
                .filter(u -> Boolean.TRUE.equals(u.getActive()))
                .count();

        // ---- movements last 30 days ----
        LocalDate windowStart = today.minusDays(29);
        Map<String, long[]> daily = new LinkedHashMap<>();
        for (int i = 0; i < 30; i++) {
            daily.put(windowStart.plusDays(i).toString(), new long[]{0, 0});
        }

        for (StockLog log : stockLogRepository.findAllByOrderByChangedAtDesc()) {
            if (log.getChangedAt() == null) {
                continue;
            }
            LocalDate day = log.getChangedAt().toLocalDate();
            if (day.isBefore(windowStart)) {
                continue;
            }
            long[] slot = daily.get(day.toString());
            if (slot == null) {
                continue;
            }
            if (log.getChangeQuantity() != null && log.getChangeQuantity() > 0) {
                slot[0] += log.getChangeQuantity();
            } else if (log.getChangeQuantity() != null) {
                slot[1] += -log.getChangeQuantity();
            }
        }

        List<Map<String, Object>> movements = new ArrayList<>();
        daily.forEach((date, inOut) -> movements.add(Map.of(
                "date", date,
                "in", inOut[0],
                "out", inOut[1])));

        // ---- expiry timeline (rolling 6 months incl. overdue) ----
        List<Map<String, Object>> expiryTimeline = new ArrayList<>();
        expiryTimeline.add(Map.of(
                "label", "Overdue",
                "count", inventory.stream()
                        .filter(i -> i.getExpiryDate() != null
                                && i.getExpiryDate().isBefore(today))
                        .count()));
        for (int month = 0; month < 6; month++) {
            LocalDate start = today.plusMonths(month);
            LocalDate end = start.plusMonths(1);
            long count = inventory.stream()
                    .filter(i -> i.getExpiryDate() != null
                            && !i.getExpiryDate().isBefore(start)
                            && i.getExpiryDate().isBefore(end))
                    .count();
            expiryTimeline.add(Map.of(
                    "label", start.format(MONTH),
                    "count", count));
        }

        // ---- monthly PO value (last 6 months) ----
        List<Map<String, Object>> monthlyPoValue = new ArrayList<>();
        for (int month = 5; month >= 0; month--) {
            LocalDate start = today.minusMonths(month).withDayOfMonth(1);
            LocalDate end = start.plusMonths(1);
            BigDecimal value = orders.stream()
                    .filter(o -> o.getOrderDate() != null
                            && !o.getOrderDate().isBefore(start)
                            && o.getOrderDate().isBefore(end))
                    .map(PurchaseOrder::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            monthlyPoValue.add(Map.of(
                    "month", start.format(MONTH),
                    "value", value));
        }

        // ---- user role distribution ----
        Map<String, Long> roleCounts = new LinkedHashMap<>();
        users.forEach(u -> roleCounts.merge(
                u.getRole().getRoleName(), 1L, Long::sum));
        List<Map<String, Object>> userRoles = new ArrayList<>();
        roleCounts.forEach((role, count) ->
                userRoles.add(Map.of("role", role, "count", count)));

        // ---- stock by category / supplier ----
        List<Map<String, Object>> stockByCategory =
                toList(categoryQty, "category");
        stockByCategory.sort(Comparator.comparing(
                m -> (String) m.get("category")));
        List<Map<String, Object>> stockBySupplier =
                toList(supplierQty, "supplier");

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalMedicines", medicines.size());
        kpis.put("totalBatches", inventory.size());
        kpis.put("totalUnits", totalUnits);
        kpis.put("stockValue", stockValue);
        kpis.put("lowStockCount", lowStock);
        kpis.put("expiringSoonCount", expiringSoon);
        kpis.put("expiredCount", expired);
        kpis.put("pendingOrders", pendingOrders);
        kpis.put("activeUsers", activeUsers);
        kpis.put("unreadNotifications", notificationRepository.countByReadFalse());

        Map<String, Object> healthBuckets = new LinkedHashMap<>();
        healthBuckets.put("healthy", healthy);
        healthBuckets.put("expiringSoon", expiringSoon);
        healthBuckets.put("expired", expired);

        return new Response(
                kpis,
                healthBuckets,
                movements,
                stockByCategory,
                expiryTimeline,
                stockBySupplier,
                monthlyPoValue,
                userRoles);
    }

    private static List<Map<String, Object>> toList(
            Map<String, Long> source, String keyName) {
        List<Map<String, Object>> result = new ArrayList<>();
        source.forEach((key, value) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put(keyName, key);
            row.put("quantity", value);
            result.add(row);
        });
        return result;
    }

    public static class Response {
        private final Map<String, Object> kpis;
        private final Map<String, Object> healthBuckets;
        private final List<Map<String, Object>> movementsLast30Days;
        private final List<Map<String, Object>> stockByCategory;
        private final List<Map<String, Object>> expiryTimeline;
        private final List<Map<String, Object>> stockBySupplier;
        private final List<Map<String, Object>> monthlyPoValue;
        private final List<Map<String, Object>> userRoles;

        public Response(Map<String, Object> kpis,
                        Map<String, Object> healthBuckets,
                        List<Map<String, Object>> movementsLast30Days,
                        List<Map<String, Object>> stockByCategory,
                        List<Map<String, Object>> expiryTimeline,
                        List<Map<String, Object>> stockBySupplier,
                        List<Map<String, Object>> monthlyPoValue,
                        List<Map<String, Object>> userRoles) {
            this.kpis = kpis;
            this.healthBuckets = healthBuckets;
            this.movementsLast30Days = movementsLast30Days;
            this.stockByCategory = stockByCategory;
            this.expiryTimeline = expiryTimeline;
            this.stockBySupplier = stockBySupplier;
            this.monthlyPoValue = monthlyPoValue;
            this.userRoles = userRoles;
        }

        public Map<String, Object> getKpis() { return kpis; }
        public Map<String, Object> getHealthBuckets() { return healthBuckets; }
        public List<Map<String, Object>> getMovementsLast30Days() { return movementsLast30Days; }
        public List<Map<String, Object>> getStockByCategory() { return stockByCategory; }
        public List<Map<String, Object>> getExpiryTimeline() { return expiryTimeline; }
        public List<Map<String, Object>> getStockBySupplier() { return stockBySupplier; }
        public List<Map<String, Object>> getMonthlyPoValue() { return monthlyPoValue; }
        public List<Map<String, Object>> getUserRoles() { return userRoles; }
    }
}
