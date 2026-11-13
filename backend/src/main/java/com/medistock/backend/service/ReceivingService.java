package com.medistock.backend.service;

import com.medistock.backend.dto.OrderDtos.OrderResponse;
import com.medistock.backend.dto.ReceiveDtos.*;
import com.medistock.backend.entity.*;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReceivingService {
    private final PurchaseOrderRepository orders;
    private final MedicineBatchRepository batches;
    private final StockLogRepository logs;
    private final UserRepository users;

    public ReceivingService(PurchaseOrderRepository orders, MedicineBatchRepository batches,
                            StockLogRepository logs, UserRepository users) {
        this.orders = orders; this.batches = batches; this.logs = logs; this.users = users;
    }

    /**
     * Receives some or all of a dispatched order. Each item can arrive in parts:
     * the order becomes "Partially received" until every unit has arrived, then "Received".
     * Everything happens in one transaction, so if anything is wrong nothing is saved.
     */
    @Transactional
    public OrderResponse receive(Long id, ReceiveRequest r, String username) {
        PurchaseOrder o = orders.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (o.getStatus() != OrderStatus.DISPATCHED && o.getStatus() != OrderStatus.PARTIALLY_RECEIVED)
            throw new ApiException(HttpStatus.CONFLICT, "Only a Dispatched or Partially received order can be received (this one is "
                + o.getStatus().name().replace('_', ' ').toLowerCase() + ")");

        Set<Long> itemIds = o.getItems().stream().map(PurchaseOrderItem::getId).collect(Collectors.toSet());
        Map<Long, ReceiveItem> byItem = new HashMap<>();
        for (ReceiveItem ri : r.items()) {
            if (!itemIds.contains(ri.itemId())) throw bad("items", "An item does not belong to this order");
            if (byItem.put(ri.itemId(), ri) != null) throw bad("items", "An item is listed twice");
        }

        User user = users.findByUsernameIgnoreCase(username).orElse(null);
        boolean anything = false;
        for (PurchaseOrderItem item : o.getItems()) {
            ReceiveItem ri = byItem.get(item.getId());
            if (ri == null || ri.quantity() == 0) continue;   // nothing from this item this time
            Medicine m = item.getMedicine();
            int remaining = item.getQuantity() - item.getReceivedQuantity();
            if (ri.quantity() > remaining)
                throw bad("items", m.getName() + ": only " + remaining + " units are still to be received");
            if (ri.batchNumber() == null || ri.batchNumber().isBlank() || ri.manufacturingDate() == null || ri.expiryDate() == null)
                throw bad("items", "Batch number and dates are required for " + m.getName());
            if (ri.manufacturingDate().isAfter(LocalDate.now()))
                throw bad("items", "Manufacturing date cannot be in the future");
            if (!ri.expiryDate().isAfter(ri.manufacturingDate()))
                throw bad("items", "Expiry date must be after the manufacturing date");

            m.setActive(true);   // stock must have somewhere to go, even if the medicine was hidden meanwhile
            String batchNo = ri.batchNumber().trim();
            MedicineBatch b = batches.findByMedicineIdAndBatchNumberIgnoreCase(m.getId(), batchNo).orElse(null);
            if (b == null) {
                b = new MedicineBatch();
                b.setMedicine(m);
                b.setSupplier(o.getSupplier());
                b.setBatchNumber(batchNo);
                b.setManufacturingDate(ri.manufacturingDate());
                b.setExpiryDate(ri.expiryDate());
                b.setPrice(item.getUnitPrice());
            } else if (!b.getExpiryDate().equals(ri.expiryDate())) {
                throw bad("items", "Batch " + batchNo + " of " + m.getName() + " already exists with a different expiry date");
            }
            b.setQuantity(b.getQuantity() + ri.quantity());
            b = batches.save(b);
            item.setReceivedQuantity(item.getReceivedQuantity() + ri.quantity());

            StockLog log = new StockLog();
            log.setBatch(b);
            log.setChangeQuantity(ri.quantity());
            log.setQuantityAfter(b.getQuantity());
            log.setType(StockChangeType.PURCHASE_RECEIVED);
            log.setNote("Received on " + o.getOrderNumber());
            log.setPerformedBy(user);
            logs.save(log);
            anything = true;
        }
        if (!anything) throw bad("items", "Enter a quantity for at least one medicine");

        boolean complete = o.getItems().stream().allMatch(i -> i.getReceivedQuantity() >= i.getQuantity());
        o.setStatus(complete ? OrderStatus.RECEIVED : OrderStatus.PARTIALLY_RECEIVED);
        if (complete) o.setDeliveredAt(Instant.now());
        return OrderService.toDto(o);
    }

    private static ApiException bad(String field, String msg) { return new ApiException(HttpStatus.BAD_REQUEST, msg, field); }
}
