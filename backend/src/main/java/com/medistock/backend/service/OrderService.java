package com.medistock.backend.service;

import com.medistock.backend.dto.OrderDtos.*;
import com.medistock.backend.entity.*;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {
    private final PurchaseOrderRepository orders;
    private final SupplierRepository suppliers;
    private final MedicineRepository medicines;
    private final UserRepository users;
    private final SettingsService settings;
    private final NotificationService notify;

    public OrderService(PurchaseOrderRepository orders, SupplierRepository suppliers,
                        MedicineRepository medicines, UserRepository users, SettingsService settings,
                        NotificationService notify) {
        this.orders = orders; this.suppliers = suppliers; this.medicines = medicines; this.users = users;
        this.settings = settings;
        this.notify = notify;
    }

    /** Admin and Pharmacist see every order. A Supplier sees only the orders placed with them. */
    @Transactional(readOnly = true)
    public List<OrderResponse> list(String username) {
        User u = user(username);
        List<PurchaseOrder> list = u.getRole() == Role.SUPPLIER
            ? orders.findBySupplierIdOrderByCreatedAtDescIdDesc(supplierIdOf(u)).stream().filter(o -> visibleToSupplier(o.getStatus())).toList()
            : orders.findAllByOrderByCreatedAtDescIdDesc();
        return list.stream().map(OrderService::toDto).toList();
    }

    @Transactional
    public OrderResponse create(OrderRequest r, String username) {
        Supplier s = suppliers.findById(r.supplierId()).orElseThrow(() -> bad("supplierId", "Supplier not found"));
        if (!s.isActive()) throw bad("supplierId", "This supplier is inactive");
        if (r.expectedDate() != null && r.expectedDate().isBefore(LocalDate.now()))
            throw bad("expectedDate", "Expected date cannot be in the past");

        PurchaseOrder o = new PurchaseOrder();
        o.setSupplier(s);
        // When the Admin has switched approval off in Settings, the order goes straight to the supplier
        o.setStatus(settings.requireOrderApproval() ? OrderStatus.AWAITING_APPROVAL : OrderStatus.PENDING);
        o.setExpectedDate(r.expectedDate());
        o.setNotes(r.notes() == null || r.notes().isBlank() ? null : r.notes().trim());
        o.setCreatedBy(user(username));

        Set<Long> seen = new HashSet<>();
        for (OrderItemRequest i : r.items()) {
            if (!seen.add(i.medicineId())) throw bad("items", "The same medicine is listed twice");
            Medicine m = medicines.findById(i.medicineId()).filter(Medicine::isActive)
                .orElseThrow(() -> bad("items", "Medicine " + i.medicineId() + " not found"));
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setMedicine(m);
            item.setQuantity(i.quantity());
            item.setUnitPrice(i.unitPrice());
            o.addItem(item);
        }
        orders.save(o);
        o.setOrderNumber("PO-" + (1000 + o.getId()));
        OrderResponse dto = toDto(o);
        String who = o.getCreatedBy() == null ? "A pharmacist" : o.getCreatedBy().getUsername();
        if (o.getStatus() == OrderStatus.AWAITING_APPROVAL)
            notify.toRole(Role.ADMIN, "Order " + dto.orderNumber() + " needs your approval",
                who + " placed an order with " + s.getName() + " worth Rs " + dto.totalAmount() + ". Please review it.");
        else
            notify.toUsers(supplierUsers(s), "New order " + dto.orderNumber(), "A new order worth Rs " + dto.totalAmount() + " is waiting for you to accept.");
        return dto;
    }

    /** Admin: Awaiting approval -> Pending, so the supplier can now accept it */
    @Transactional
    public OrderResponse approve(Long id, String username) {
        PurchaseOrder o = find(id);
        requireStatus(o, OrderStatus.AWAITING_APPROVAL, "approved");
        o.setStatus(OrderStatus.PENDING);
        markReviewed(o, username);
        notify.toUsers(creator(o), "Order " + o.getOrderNumber() + " approved", "The Admin approved your order. It has been sent to " + o.getSupplier().getName() + ".");
        notify.toUsers(supplierUsers(o.getSupplier()), "New order " + o.getOrderNumber(), "A new approved order is waiting for you to accept.");
        return toDto(o);
    }

    /** Admin: Awaiting approval -> Rejected, with a reason the Pharmacist can read */
    @Transactional
    public OrderResponse reject(Long id, String reason, String username) {
        PurchaseOrder o = find(id);
        requireStatus(o, OrderStatus.AWAITING_APPROVAL, "rejected");
        o.setStatus(OrderStatus.REJECTED);
        o.setRejectionReason(reason.trim());
        markReviewed(o, username);
        notify.toUsers(creator(o), "Order " + o.getOrderNumber() + " rejected", "The Admin rejected your order. Reason: " + o.getRejectionReason());
        return toDto(o);
    }

    /** Supplier: Pending -> Accepted */
    @Transactional
    public OrderResponse accept(Long id, String username) {
        PurchaseOrder o = ownOrder(id, username);
        requireStatus(o, OrderStatus.PENDING, "accepted");
        o.setStatus(OrderStatus.ACCEPTED);
        notify.toUsers(creator(o), "Order " + o.getOrderNumber() + " accepted", o.getSupplier().getName() + " accepted your order.");
        return toDto(o);
    }

    /** Supplier: Accepted -> Dispatched */
    @Transactional
    public OrderResponse dispatch(Long id, String username) {
        PurchaseOrder o = ownOrder(id, username);
        requireStatus(o, OrderStatus.ACCEPTED, "dispatched");
        o.setStatus(OrderStatus.DISPATCHED);
        notify.toUsers(creator(o), "Order " + o.getOrderNumber() + " dispatched", o.getSupplier().getName() + " sent your order. Receive the stock when it arrives.");
        return toDto(o);
    }

    /** Pharmacist: only before the goods are dispatched */
    @Transactional
    public OrderResponse cancel(Long id) {
        PurchaseOrder o = orders.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (o.getStatus() != OrderStatus.AWAITING_APPROVAL && o.getStatus() != OrderStatus.PENDING && o.getStatus() != OrderStatus.ACCEPTED)
            throw new ApiException(HttpStatus.CONFLICT, "Only orders that have not been dispatched can be cancelled (this one is " + label(o.getStatus()) + ")");
        o.setStatus(OrderStatus.CANCELLED);
        return toDto(o);
    }

    // A supplier can only touch its own orders. Anything else looks like "not found".
    private PurchaseOrder ownOrder(Long id, String username) {
        Long supplierId = supplierIdOf(user(username));
        return orders.findById(id).filter(o -> o.getSupplier().getId().equals(supplierId) && visibleToSupplier(o.getStatus()))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private static void requireStatus(PurchaseOrder o, OrderStatus needed, String action) {
        if (o.getStatus() != needed)
            throw new ApiException(HttpStatus.CONFLICT, "Only an order marked " + label(needed) + " can be " + action
                + " (this one is " + label(o.getStatus()) + ")");
    }

    private static List<User> creator(PurchaseOrder o) { return o.getCreatedBy() == null ? List.of() : List.of(o.getCreatedBy()); }

    private List<User> supplierUsers(Supplier s) {
        return users.findAll().stream().filter(u -> u.getRole() == Role.SUPPLIER && u.getSupplier() != null
            && u.getSupplier().getId().equals(s.getId())).toList();
    }

    private PurchaseOrder find(Long id) {
        return orders.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private void markReviewed(PurchaseOrder o, String username) {
        o.setReviewedBy(user(username));
        o.setReviewedAt(Instant.now());
    }

    // Suppliers only see an order once the Admin has approved it
    private static boolean visibleToSupplier(OrderStatus s) {
        return s != OrderStatus.AWAITING_APPROVAL && s != OrderStatus.REJECTED;
    }

    private static Long supplierIdOf(User u) {
        if (u.getSupplier() == null)
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account is not linked to a supplier. Please ask an admin.");
        return u.getSupplier().getId();
    }

    private User user(String username) {
        return users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    private static ApiException bad(String field, String msg) { return new ApiException(HttpStatus.BAD_REQUEST, msg, field); }
    private static String label(OrderStatus s) {
        String t = s.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(t.charAt(0)) + t.substring(1);
    }

    static OrderResponse toDto(PurchaseOrder o) {
        List<OrderItemResponse> items = o.getItems().stream().map(i -> new OrderItemResponse(
            i.getId(), i.getMedicine().getId(), i.getMedicine().getName(), i.getQuantity(), i.getUnitPrice(),
            o.getStatus() == OrderStatus.RECEIVED ? i.getQuantity() : i.getReceivedQuantity())).toList();
        BigDecimal total = o.getItems().stream()
            .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new OrderResponse(o.getId(), o.getOrderNumber(), o.getSupplier().getId(), o.getSupplier().getName(),
            label(o.getStatus()), o.getExpectedDate(), o.getNotes(),
            o.getCreatedBy() == null ? null : o.getCreatedBy().getUsername(),
            o.getCreatedAt(), o.getDeliveredAt(), total, items,
            o.getReviewedBy() == null ? null : o.getReviewedBy().getUsername(), o.getReviewedAt(), o.getRejectionReason());
    }
}
