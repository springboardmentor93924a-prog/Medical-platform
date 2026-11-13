package com.medistock.backend.service;

import com.medistock.backend.dto.AlertDtos.AlertResponse;
import com.medistock.backend.entity.*;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.MedicineBatchRepository;
import com.medistock.backend.repository.PurchaseOrderRepository;
import com.medistock.backend.repository.StockLogRepository;
import com.medistock.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AlertService {
    private static final int NEAR_EXPIRY_DAYS = 90;

    private final MedicineBatchRepository batches;
    private final StockLogRepository logs;
    private final UserRepository users;
    private final PurchaseOrderRepository orders;

    public AlertService(MedicineBatchRepository batches, StockLogRepository logs, UserRepository users,
                        PurchaseOrderRepository orders) {
        this.batches = batches; this.logs = logs; this.users = users; this.orders = orders;
    }

    /** Alerts are worked out live from the current stock, so they are always up to date. */
    @Transactional(readOnly = true)
    public List<AlertResponse> list() {
        LocalDate today = LocalDate.now();
        List<MedicineBatch> all = batches.findAll().stream().filter(b -> b.getMedicine().isActive()).toList();
        List<AlertResponse> out = new ArrayList<>();

        // Stock alerts: per medicine, counting only batches that have not expired
        Map<Long, List<MedicineBatch>> byMedicine = all.stream().collect(Collectors.groupingBy(b -> b.getMedicine().getId()));
        for (List<MedicineBatch> group : byMedicine.values()) {
            Medicine m = group.get(0).getMedicine();
            int usable = group.stream().filter(b -> !b.getExpiryDate().isBefore(today)).mapToInt(MedicineBatch::getQuantity).sum();
            if (usable == 0) {
                out.add(new AlertResponse("OUT-" + m.getId(), "Out of stock", "critical", "Stock",
                    m.getName() + " is out of stock", "No usable stock left. Reorder level is " + m.getReorderLevel(),
                    m.getId(), null, 0));
            } else if (usable <= m.getReorderLevel()) {
                out.add(new AlertResponse("LOW-" + m.getId(), "Low stock", "warning", "Stock",
                    m.getName() + " is running low", usable + " left (reorder level " + m.getReorderLevel() + ")",
                    m.getId(), null, usable));
            }
        }

        // Expiry alerts: per batch that still has stock
        for (MedicineBatch b : all) {
            if (b.getQuantity() == 0) continue;
            long days = ChronoUnit.DAYS.between(today, b.getExpiryDate());
            String name = b.getMedicine().getName();
            if (days < 0) {
                out.add(new AlertResponse("EXPIRED-" + b.getId(), "Expired", "critical", "Expiry",
                    name + " (batch " + b.getBatchNumber() + ") expired " + (-days) + " days ago",
                    b.getQuantity() + " units are still in stock and should be removed",
                    b.getMedicine().getId(), b.getId(), b.getQuantity()));
            } else if (days <= NEAR_EXPIRY_DAYS) {
                out.add(new AlertResponse("NEAR-" + b.getId(), "Near expiry", "warning", "Expiry",
                    name + " (batch " + b.getBatchNumber() + ") expires in " + days + " days",
                    b.getQuantity() + " units, expiry date " + b.getExpiryDate(),
                    b.getMedicine().getId(), b.getId(), b.getQuantity()));
            }
        }
        out.sort(Comparator.comparing((AlertResponse a) -> !"critical".equals(a.severity())).thenComparing(AlertResponse::title));
        return out;
    }

    /** Stock and expiry alerts plus purchase alerts. For Admin and Pharmacist. */
    @Transactional(readOnly = true)
    public List<AlertResponse> listAll() {
        List<AlertResponse> out = new ArrayList<>(list());
        out.addAll(purchaseAlerts());
        out.sort(Comparator.comparing((AlertResponse a) -> !"critical".equals(a.severity())).thenComparing(AlertResponse::title));
        return out;
    }

    /** Open orders that need attention: overdue, on the way, partly delivered, or ignored by the supplier. */
    private List<AlertResponse> purchaseAlerts() {
        LocalDate today = LocalDate.now();
        List<AlertResponse> out = new ArrayList<>();
        for (PurchaseOrder o : orders.findAllByOrderByCreatedAtDescIdDesc()) {
            OrderStatus st = o.getStatus();
            if (st == OrderStatus.REJECTED) {
                if (o.getReviewedAt() != null && ChronoUnit.DAYS.between(o.getReviewedAt(), Instant.now()) < 7)
                    out.add(purchase("REJ-" + o.getId(), "Order rejected", "warning",
                        o.getOrderNumber() + " was rejected", "Reason: " + o.getRejectionReason()));
                continue;
            }
            if (st == OrderStatus.RECEIVED || st == OrderStatus.CANCELLED) continue;
            String ref = o.getOrderNumber() + " from " + o.getSupplier().getName();

            if (o.getExpectedDate() != null && o.getExpectedDate().isBefore(today)) {
                long late = ChronoUnit.DAYS.between(o.getExpectedDate(), today);
                out.add(purchase("LATE-" + o.getId(), "Order overdue", "critical",
                    ref + " is " + late + " day" + (late == 1 ? "" : "s") + " overdue",
                    "It was expected on " + o.getExpectedDate() + ". Status: " + status(st)));
            }
            if (st == OrderStatus.AWAITING_APPROVAL) {
                out.add(purchase("APPR-" + o.getId(), "Awaiting approval", "warning",
                    ref + " is waiting for admin approval", "Placed " + ChronoUnit.DAYS.between(o.getCreatedAt(), Instant.now()) + " days ago"));
            } else if (st == OrderStatus.DISPATCHED) {
                out.add(purchase("SHIP-" + o.getId(), "Ready to receive", "warning",
                    ref + " has been dispatched", "Receive the stock when it arrives"));
            } else if (st == OrderStatus.PARTIALLY_RECEIVED) {
                int left = o.getItems().stream().mapToInt(i -> i.getQuantity() - i.getReceivedQuantity()).sum();
                out.add(purchase("PART-" + o.getId(), "Partially received", "warning",
                    ref + " is waiting for the rest", left + " units are still to arrive"));
            } else if (st == OrderStatus.PENDING) {
                long days = ChronoUnit.DAYS.between(o.getCreatedAt(), Instant.now());
                if (days >= 3)
                    out.add(purchase("WAIT-" + o.getId(), "Awaiting supplier", "warning",
                        ref + " has not been accepted yet", "Placed " + days + " days ago"));
            }
        }
        return out;
    }

    private static AlertResponse purchase(String id, String type, String severity, String title, String detail) {
        return new AlertResponse(id, type, severity, "Purchase", title, detail, null, null, 0);
    }

    private static String status(OrderStatus s) {
        String t = s.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(t.charAt(0)) + t.substring(1);
    }

    /** Sets an expired batch to zero stock and records it in the history. */
    @Transactional
    public void removeExpired(Long batchId, String username) {
        MedicineBatch b = batches.findById(batchId).filter(x -> x.getMedicine().isActive())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Batch not found"));
        if (!b.getExpiryDate().isBefore(LocalDate.now()))
            throw new ApiException(HttpStatus.CONFLICT, "This batch has not expired");
        if (b.getQuantity() == 0)
            throw new ApiException(HttpStatus.CONFLICT, "This batch has no stock left");

        int removed = b.getQuantity();
        b.setQuantity(0);
        StockLog log = new StockLog();
        log.setBatch(b);
        log.setChangeQuantity(-removed);
        log.setQuantityAfter(0);
        log.setType(StockChangeType.EXPIRED_REMOVED);
        log.setNote("Expired stock removed");
        log.setPerformedBy(users.findByUsernameIgnoreCase(username).orElse(null));
        logs.save(log);
    }
}
