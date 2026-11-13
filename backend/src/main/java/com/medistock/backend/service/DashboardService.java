package com.medistock.backend.service;

import com.medistock.backend.dto.AlertDtos.AlertResponse;
import com.medistock.backend.dto.DashboardDtos.*;
import com.medistock.backend.entity.*;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private static final List<String> STATUSES = List.of("Awaiting approval", "Pending", "Accepted", "Dispatched", "Partially received", "Received", "Rejected", "Cancelled");

    private final MedicineBatchRepository batches;
    private final PurchaseOrderRepository orders;
    private final SupplierRepository suppliers;
    private final StockLogRepository logs;
    private final UserRepository users;
    private final AlertService alerts;

    public DashboardService(MedicineBatchRepository batches, PurchaseOrderRepository orders, SupplierRepository suppliers,
                            StockLogRepository logs, UserRepository users, AlertService alerts) {
        this.batches = batches; this.orders = orders; this.suppliers = suppliers;
        this.logs = logs; this.users = users; this.alerts = alerts;
    }

    @Transactional(readOnly = true)
    public DashboardResponse build(String username) {
        User u = users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
        List<MedicineBatch> active = batches.findAll().stream().filter(b -> b.getMedicine().isActive()).toList();
        return u.getRole() == Role.SUPPLIER ? supplierView(u, active) : staffView(u.getRole(), active);
    }

    private DashboardResponse staffView(Role role, List<MedicineBatch> active) {
        List<AlertResponse> all = alerts.list();
        List<AlertResponse> stock = all.stream().filter(a -> a.category().equals("Stock")).toList();

        // Expiry counts every batch that is expired or expires within 90 days, even if its stock was removed
        LocalDate today = LocalDate.now();
        List<MedicineBatch> expiring = active.stream()
            .filter(b -> ChronoUnit.DAYS.between(today, b.getExpiryDate()) <= 90)
            .sorted(Comparator.comparing((MedicineBatch b) -> b.getQuantity() == 0).thenComparing(MedicineBatch::getExpiryDate))
            .toList();
        long expired = expiring.stream().filter(b -> b.getExpiryDate().isBefore(today)).count();
        List<AlertResponse> expiryList = expiring.stream().limit(5).map(b -> expiryItem(b, today)).toList();

        // Chart data: medicines by stock status (usable stock only) and batches by time left
        long ok = 0, low = 0, out = 0;
        for (List<MedicineBatch> group : active.stream().collect(Collectors.groupingBy(b -> b.getMedicine().getId())).values()) {
            int usable = group.stream().filter(b -> !b.getExpiryDate().isBefore(today)).mapToInt(MedicineBatch::getQuantity).sum();
            if (usable == 0) out++;
            else if (usable <= group.get(0).getMedicine().getReorderLevel()) low++;
            else ok++;
        }
        List<LabelValue> stockStatus = List.of(new LabelValue("In stock", ok), new LabelValue("Low stock", low), new LabelValue("Out of stock", out));
        long in30 = expiring.stream().filter(b -> days(b, today) >= 0 && days(b, today) <= 30).count();
        long in60 = expiring.stream().filter(b -> days(b, today) > 30 && days(b, today) <= 60).count();
        long in90 = expiring.stream().filter(b -> days(b, today) > 60).count();
        List<LabelValue> expiryBuckets = List.of(new LabelValue("Expired", expired), new LabelValue("0-30 days", in30),
            new LabelValue("31-60 days", in60), new LabelValue("61-90 days", in90));

        Map<String, Number> stats = new LinkedHashMap<>();
        stats.put("medicines", active.stream().map(b -> b.getMedicine().getId()).distinct().count());
        stats.put("lowStock", stock.size());
        stats.put("expired", expired);
        stats.put("expiringSoon", expiring.size() - expired);
        stats.put("units", active.stream().mapToInt(MedicineBatch::getQuantity).sum());

        List<LabelValue> byCategory = null;
        Map<String, Long> orderStatus = null;
        List<SupplierStat> supplierStats = null;
        List<ActivityItem> activity = null;
        List<LabelValue> monthly = null;

        if (role == Role.ADMIN || role == Role.PHARMACIST) {
            stats.put("inventoryValue", active.stream()
                .map(b -> b.getPrice().multiply(BigDecimal.valueOf(b.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add));
            byCategory = active.stream()
                .collect(Collectors.groupingBy(b -> b.getMedicine().getCategory().getName(),
                         TreeMap::new, Collectors.summingLong(MedicineBatch::getQuantity)))
                .entrySet().stream().map(e -> new LabelValue(e.getKey(), e.getValue())).toList();
            List<PurchaseOrder> allOrders = orders.findAll();
            orderStatus = statusCounts(allOrders);
            monthly = monthlyTotals(allOrders);
            supplierStats = suppliers.findAll().stream()
                .sorted(Comparator.comparing(Supplier::getName))
                .map(s -> supplierStat(s, allOrders)).toList();
        }
        if (role == Role.ADMIN) {
            stats.put("users", users.count());
            activity = logs.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, 6)).stream().map(l -> {
                MedicineBatch b = l.getBatch();
                String change = (l.getChangeQuantity() > 0 ? "+" : "") + l.getChangeQuantity();
                String type = l.getType().name().toLowerCase().replace('_', ' ');
                return new ActivityItem(b.getMedicine().getName() + " (batch " + b.getBatchNumber() + "): " + change
                    + " units, " + type, l.getPerformedBy() == null ? "System" : l.getPerformedBy().getUsername(), l.getCreatedAt());
            }).toList();
        }
        return new DashboardResponse(label(role), stats, stock.stream().limit(5).toList(), expiryList,
            byCategory, orderStatus, supplierStats, activity, null, stockStatus, expiryBuckets, monthly);
    }

    private static long days(MedicineBatch b, LocalDate today) { return ChronoUnit.DAYS.between(today, b.getExpiryDate()); }

    /** Value of approved orders for each of the last 6 months, oldest first. Rejected, cancelled and unapproved orders are left out. */
    private static List<LabelValue> monthlyTotals(List<PurchaseOrder> allOrders) {
        YearMonth now = YearMonth.now();
        List<LabelValue> result = new ArrayList<>();
        for (int back = 5; back >= 0; back--) {
            YearMonth month = now.minusMonths(back);
            BigDecimal total = allOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.REJECTED
                          && o.getStatus() != OrderStatus.AWAITING_APPROVAL)
                .filter(o -> YearMonth.from(o.getCreatedAt().atZone(ZoneId.systemDefault())).equals(month))
                .flatMap(o -> o.getItems().stream())
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            result.add(new LabelValue(month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                + " " + String.format("%02d", month.getYear() % 100), total.longValue()));
        }
        return result;
    }

    private static AlertResponse expiryItem(MedicineBatch b, LocalDate today) {
        long days = ChronoUnit.DAYS.between(today, b.getExpiryDate());
        String name = b.getMedicine().getName() + " (batch " + b.getBatchNumber() + ")";
        String title = days < 0 ? name + " expired " + (-days) + " days ago" : name + " expires in " + days + " days";
        String detail = b.getQuantity() == 0 ? "No stock left in this batch" : b.getQuantity() + " units, expiry date " + b.getExpiryDate();
        return new AlertResponse("EXP-" + b.getId(), days < 0 ? "Expired" : "Near expiry", days < 0 ? "critical" : "warning",
            "Expiry", title, detail, b.getMedicine().getId(), b.getId(), b.getQuantity());
    }

    private DashboardResponse supplierView(User u, List<MedicineBatch> active) {
        if (u.getSupplier() == null)
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account is not linked to a supplier. Please ask an admin.");
        Long supplierId = u.getSupplier().getId();
        List<PurchaseOrder> mine = orders.findBySupplierIdOrderByCreatedAtDescIdDesc(supplierId).stream()
            .filter(o -> o.getStatus() != OrderStatus.AWAITING_APPROVAL && o.getStatus() != OrderStatus.REJECTED).toList();
        Map<String, Long> counts = statusCounts(mine);
        counts.remove("Awaiting approval");   // suppliers never see these two stages
        counts.remove("Rejected");

        Map<String, Number> stats = new LinkedHashMap<>();
        stats.put("pending", counts.get("Pending"));
        stats.put("accepted", counts.get("Accepted"));
        stats.put("dispatched", counts.get("Dispatched"));
        stats.put("delivered", counts.get("Received"));

        List<SuppliedMedicine> supplied = active.stream()
            .filter(b -> b.getSupplier().getId().equals(supplierId))
            .collect(Collectors.groupingBy(b -> b.getMedicine().getName(), TreeMap::new, Collectors.summingInt(MedicineBatch::getQuantity)))
            .entrySet().stream().map(e -> new SuppliedMedicine(e.getKey(), e.getValue())).toList();
        return new DashboardResponse("Supplier", stats, null, null, null, counts, null, null, supplied, null, null, null);
    }

    private static Map<String, Long> statusCounts(List<PurchaseOrder> list) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String s : STATUSES) counts.put(s, 0L);
        for (PurchaseOrder o : list) counts.merge(label(o.getStatus()), 1L, Long::sum);
        return counts;
    }

    /** On-time % = share of received orders delivered on or before their expected date. */
    private static SupplierStat supplierStat(Supplier s, List<PurchaseOrder> allOrders) {
        List<PurchaseOrder> mine = allOrders.stream().filter(o -> o.getSupplier().getId().equals(s.getId())).toList();
        List<PurchaseOrder> received = mine.stream().filter(o -> o.getStatus() == OrderStatus.RECEIVED).toList();
        List<PurchaseOrder> timed = received.stream().filter(o -> o.getExpectedDate() != null && o.getDeliveredAt() != null).toList();
        Integer onTime = timed.isEmpty() ? null : (int) Math.round(100.0 * timed.stream()
            .filter(o -> !o.getDeliveredAt().atZone(ZoneId.systemDefault()).toLocalDate().isAfter(o.getExpectedDate()))
            .count() / timed.size());
        return new SupplierStat(s.getName(), mine.size(), received.size(), onTime);
    }

    private static String label(Enum<?> e) {
        String t = e.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(t.charAt(0)) + t.substring(1);
    }
}
