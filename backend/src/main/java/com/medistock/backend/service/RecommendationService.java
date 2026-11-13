package com.medistock.backend.service;

import com.medistock.backend.dto.InventoryDtos.InventoryRow;
import com.medistock.backend.dto.RecommendationDtos.*;
import com.medistock.backend.entity.OrderStatus;
import com.medistock.backend.entity.PurchaseOrder;
import com.medistock.backend.entity.StockChangeType;
import com.medistock.backend.entity.StockLog;
import com.medistock.backend.repository.PurchaseOrderRepository;
import com.medistock.backend.repository.StockLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Smart suggestions worked out from the system's own records. This is a statistical forecast, not a trained model.
 * Usage is estimated from stock decreases recorded in the last 60 days, so it gets better as more changes are recorded.
 */
@Service
public class RecommendationService {
    private static final int WINDOW_DAYS = 60;   // how far back usage is measured
    private static final int COVER_DAYS = 30;    // an order should cover this many days of use
    private static final int DEFAULT_LEAD = 7;   // delivery time when a supplier has no history
    private static final int SAFETY_DAYS = 7;    // reorder a little before stock would run out
    private static final Set<OrderStatus> OPEN = EnumSet.of(OrderStatus.AWAITING_APPROVAL, OrderStatus.PENDING,
        OrderStatus.ACCEPTED, OrderStatus.DISPATCHED, OrderStatus.PARTIALLY_RECEIVED);

    private final InventoryService inventory;
    private final StockLogRepository logs;
    private final PurchaseOrderRepository orders;

    public RecommendationService(InventoryService inventory, StockLogRepository logs, PurchaseOrderRepository orders) {
        this.inventory = inventory; this.logs = logs; this.orders = orders;
    }

    @Transactional(readOnly = true)
    public RecommendationResponse build() {
        List<InventoryRow> rows = inventory.list(null, null, null, null, null);
        Instant now = Instant.now();
        Instant since = now.minus(WINDOW_DAYS, ChronoUnit.DAYS);

        // Units used per medicine, and when each medicine's history starts
        Map<Long, Long> used = new HashMap<>();
        Map<Long, Instant> firstSeen = new HashMap<>();
        for (StockLog l : logs.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, 5000))) {
            long id = l.getBatch().getMedicine().getId();
            firstSeen.merge(id, l.getCreatedAt(), (a, b) -> a.isBefore(b) ? a : b);
            if (l.getType() == StockChangeType.ADJUSTMENT && l.getChangeQuantity() < 0 && l.getCreatedAt().isAfter(since))
                used.merge(id, (long) -l.getChangeQuantity(), Long::sum);
        }
        Map<Long, Double> daily = new HashMap<>();
        for (Long id : firstSeen.keySet()) {
            long days = Math.max(7, Math.min(WINDOW_DAYS, ChronoUnit.DAYS.between(firstSeen.get(id), now)));
            daily.put(id, used.getOrDefault(id, 0L) / (double) days);
        }

        // Delivery time per supplier, and units already on order per medicine
        List<PurchaseOrder> allOrders = orders.findAll();
        Map<Long, Integer> lead = new HashMap<>();
        allOrders.stream().filter(o -> o.getStatus() == OrderStatus.RECEIVED && o.getDeliveredAt() != null)
            .collect(Collectors.groupingBy(o -> o.getSupplier().getId())).forEach((sid, list) -> lead.put(sid,
                (int) Math.max(1, Math.ceil(list.stream().mapToDouble(o -> Duration.between(o.getCreatedAt(), o.getDeliveredAt()).toHours() / 24.0).average().orElse(DEFAULT_LEAD)))));
        Map<Long, Long> onOrder = new HashMap<>();
        allOrders.stream().filter(o -> OPEN.contains(o.getStatus())).flatMap(o -> o.getItems().stream())
            .forEach(i -> onOrder.merge(i.getMedicine().getId(), (long) (i.getQuantity() - i.getReceivedQuantity()), Long::sum));

        Map<Long, List<InventoryRow>> byMedicine = rows.stream().collect(Collectors.groupingBy(InventoryRow::medicineId));
        List<ReorderItem> reorders = new ArrayList<>();
        List<SlowMover> slow = new ArrayList<>();
        for (var entry : byMedicine.entrySet()) {
            long id = entry.getKey();
            List<InventoryRow> batches = entry.getValue();
            InventoryRow latest = batches.stream().max(Comparator.comparingLong(InventoryRow::batchId)).get();
            long usable = batches.stream().filter(b -> b.daysToExpiry() >= 0).mapToLong(InventoryRow::quantity).sum();
            long ordered = onOrder.getOrDefault(id, 0L);
            double perDay = daily.getOrDefault(id, 0.0);
            int leadDays = lead.getOrDefault(latest.supplierId(), DEFAULT_LEAD);

            if (perDay > 0) {
                double daysLeft = usable / perDay;
                long need = (long) Math.ceil(perDay * (COVER_DAYS + leadDays)) - usable - ordered;
                if (daysLeft <= leadDays + SAFETY_DAYS && need > 0)
                    reorders.add(new ReorderItem(id, latest.name(), latest.supplierId(), latest.supplier(), usable, ordered,
                        Math.round(perDay * 100) / 100.0, (long) Math.floor(daysLeft), leadDays, need, daysLeft <= leadDays ? "High" : "Medium",
                        String.format(Locale.ROOT, "Uses about %.1f units a day, so %d days of stock are left. %s usually delivers in about %d days.",
                            perDay, (long) Math.floor(daysLeft), latest.supplier(), leadDays)));
            } else if (usable + ordered <= latest.reorderLevel()) {
                long need = Math.max(1, latest.reorderLevel() * 2L - usable - ordered);
                reorders.add(new ReorderItem(id, latest.name(), latest.supplierId(), latest.supplier(), usable, ordered, 0, null, leadDays, need,
                    usable == 0 ? "High" : "Medium", "No usage history yet. Stock is at or below the reorder level of " + latest.reorderLevel() + "."));
            } else if (usable > latest.reorderLevel() * 3L) {
                BigDecimal value = batches.stream().map(b -> b.price().multiply(BigDecimal.valueOf(b.quantity()))).reduce(BigDecimal.ZERO, BigDecimal::add);
                slow.add(new SlowMover(latest.name(), usable, value.longValue()));   // plenty of stock and nothing used lately
            }
        }
        reorders.sort(Comparator.comparing((ReorderItem r) -> !r.priority().equals("High")).thenComparing(r -> r.daysLeft() == null ? 0 : r.daysLeft()));
        slow.sort(Comparator.comparingLong(SlowMover::valueTiedUp).reversed());

        // Batches that will probably not be used up before they expire (earliest expiry is used first)
        List<ExpiryRisk> risks = new ArrayList<>();
        for (var entry : byMedicine.entrySet()) {
            double perDay = daily.getOrDefault(entry.getKey(), 0.0);
            long ahead = 0;   // stock in batches that expire earlier
            List<InventoryRow> sorted = entry.getValue().stream().filter(b -> b.quantity() > 0 && b.daysToExpiry() >= 0)
                .sorted(Comparator.comparing(InventoryRow::expiryDate)).toList();
            for (InventoryRow b : sorted) {
                long expectedUse = perDay == 0 ? 0 : Math.max(0, Math.min(b.quantity(), Math.round(perDay * b.daysToExpiry()) - ahead));
                long atRisk = b.quantity() - expectedUse;
                ahead += b.quantity();
                if (atRisk > 0 && b.daysToExpiry() <= (perDay == 0 ? 90 : 180))
                    risks.add(new ExpiryRisk(b.batchId(), b.name(), b.batchNumber(), b.quantity(), b.expiryDate(), b.daysToExpiry(), atRisk,
                        b.price().multiply(BigDecimal.valueOf(atRisk)).longValue(),
                        b.daysToExpiry() <= 30 ? "Use first, or return the rest to the supplier" : b.daysToExpiry() <= 90 ? "Use first and do not reorder yet" : "Order less next time"));
            }
        }
        risks.sort(Comparator.comparingLong(ExpiryRisk::daysToExpiry));

        return new RecommendationResponse("Usage is estimated from the stock decreases recorded in the last " + WINDOW_DAYS
            + " days. Orders are suggested to cover " + COVER_DAYS + " days plus the supplier's delivery time.",
            reorders, risks.stream().limit(20).toList(), slow.stream().limit(10).toList());
    }
}
