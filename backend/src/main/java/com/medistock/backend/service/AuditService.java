package com.medistock.backend.service;

import com.medistock.backend.dto.AuditDtos.*;
import com.medistock.backend.entity.OrderStatus;
import com.medistock.backend.entity.StockChangeType;
import com.medistock.backend.repository.PurchaseOrderRepository;
import com.medistock.backend.repository.StockCountRepository;
import com.medistock.backend.repository.StockLogRepository;
import com.medistock.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/** Builds the audit trail from the records the system already keeps: orders, stock changes and stock counts. */
@Service
public class AuditService {
    private final PurchaseOrderRepository orders;
    private final StockLogRepository logs;
    private final StockCountRepository counts;
    private final UserRepository users;

    public AuditService(PurchaseOrderRepository orders, StockLogRepository logs, StockCountRepository counts, UserRepository users) {
        this.orders = orders; this.logs = logs; this.counts = counts; this.users = users;
    }

    private static class Tally {
        long placed, approved, rejected, receipts;
        BigDecimal value = BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public AuditResponse build() {
        Map<String, String> roles = users.findAll().stream().collect(Collectors.toMap(
            u -> u.getUsername().toLowerCase(), u -> u.getRole().name().charAt(0) + u.getRole().name().substring(1).toLowerCase(), (a, b) -> a));
        Map<String, Tally> tallies = new TreeMap<>();
        List<AuditEvent> events = new ArrayList<>();

        for (var o : orders.findAll()) {
            BigDecimal total = o.getItems().stream().map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (o.getCreatedBy() != null) {
                String who = o.getCreatedBy().getUsername();
                events.add(event(roles, o.getCreatedAt(), who, "Placed purchase order", o.getOrderNumber(),
                    o.getSupplier().getName() + ", " + o.getItems().size() + " medicine(s), Rs " + total.setScale(2), "Orders"));
                Tally t = tallies.computeIfAbsent(who, k -> new Tally());
                t.placed++;
                if (o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.REJECTED) t.value = t.value.add(total);
            }
            if (o.getReviewedBy() != null && o.getReviewedAt() != null) {
                String who = o.getReviewedBy().getUsername();
                boolean rejected = o.getStatus() == OrderStatus.REJECTED;
                events.add(event(roles, o.getReviewedAt(), who, rejected ? "Rejected purchase order" : "Approved purchase order",
                    o.getOrderNumber(), rejected ? "Reason: " + o.getRejectionReason() : "Sent to " + o.getSupplier().getName(), "Orders"));
                Tally t = tallies.computeIfAbsent(who, k -> new Tally());
                if (rejected) t.rejected++; else t.approved++;
            }
        }

        for (var l : logs.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, 500))) {
            String who = l.getPerformedBy() == null ? "System" : l.getPerformedBy().getUsername();
            var b = l.getBatch();
            String change = (l.getChangeQuantity() > 0 ? "+" : "") + l.getChangeQuantity();
            events.add(event(roles, l.getCreatedAt(), who, stockAction(l.getType()),
                b.getMedicine().getName() + " (batch " + b.getBatchNumber() + ")",
                change + " units, now " + l.getQuantityAfter() + (l.getNote() == null ? "" : ". " + l.getNote()), "Stock"));
            if (l.getType() == StockChangeType.PURCHASE_RECEIVED && l.getPerformedBy() != null)
                tallies.computeIfAbsent(who, k -> new Tally()).receipts++;
        }

        for (var c : counts.findAllByOrderByCountedAtDescIdDesc(PageRequest.of(0, 200))) {
            String target = c.getBatch().getMedicine().getName() + " (batch " + c.getBatch().getBatchNumber() + ")";
            events.add(event(roles, c.getCountedAt(), c.getCountedBy().getUsername(), "Counted stock", target,
                "System " + c.getSystemQuantity() + ", counted " + c.getCountedQuantity(), "Counts"));
            if (c.getReviewedBy() != null && c.getReviewedAt() != null)
                events.add(event(roles, c.getReviewedAt(), c.getReviewedBy().getUsername(), "Reviewed stock difference", target, "", "Counts"));
        }

        events.sort(Comparator.comparing(AuditEvent::time).reversed());
        List<AuditSummary> summary = tallies.entrySet().stream()
            .map(e -> new AuditSummary(e.getKey(), roles.getOrDefault(e.getKey().toLowerCase(), "—"), e.getValue().placed,
                e.getValue().value.longValue(), e.getValue().approved, e.getValue().rejected, e.getValue().receipts))
            .toList();
        return new AuditResponse(summary, events.stream().limit(400).toList());
    }

    private static AuditEvent event(Map<String, String> roles, Instant time, String actor, String action, String target, String detail, String category) {
        return new AuditEvent(time, actor, "System".equals(actor) ? "System" : roles.getOrDefault(actor.toLowerCase(), "—"), action, target, detail, category);
    }

    private static String stockAction(StockChangeType t) {
        return switch (t) {
            case INITIAL -> "Added medicine stock";
            case ADJUSTMENT -> "Changed stock quantity";
            case PURCHASE_RECEIVED -> "Received purchase stock";
            case EXPIRED_REMOVED -> "Removed expired stock";
            case WASTAGE_DAMAGED -> "Wrote off damaged stock";
            case WASTAGE_LOST -> "Wrote off lost or stolen stock";
            case WASTAGE_OTHER -> "Wrote off stock (other reason)";
            case RETURNED -> "Returned stock to supplier";
        };
    }
}
