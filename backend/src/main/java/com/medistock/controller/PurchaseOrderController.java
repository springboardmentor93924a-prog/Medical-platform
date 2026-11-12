
package com.medistock.controller;

import com.medistock.dto.PurchaseOrderRequest;
import com.medistock.dto.ReceivePurchaseOrderRequest;

import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.PurchaseOrderItem;
import com.medistock.entity.User;
import com.medistock.entity.Supplier;


import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;


import com.medistock.service.AuditService;
import com.medistock.service.PurchaseOrderService;
import com.medistock.service.NotificationService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping({
        "/api/purchase-orders",
        "/api/admin/purchase-orders"
})
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public PurchaseOrderController(
        PurchaseOrderService purchaseOrderService,
        UserRepository userRepository,
        SupplierRepository supplierRepository,
        AuditService auditService,
        NotificationService notificationService) {

    this.purchaseOrderService = purchaseOrderService;
    this.userRepository = userRepository;
    this.supplierRepository = supplierRepository;
    this.auditService = auditService;
    this.notificationService = notificationService;
}

    // =========================================
    // GET ALL PURCHASE ORDERS
    // =========================================

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<PurchaseOrder> getAllPurchaseOrders() {

        return purchaseOrderService.getAllOrders();
    }

    // =========================================
    // GET PURCHASE ORDER BY ID
    // =========================================

  @GetMapping("/{id:\\d+}")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'SUPPLIER', 'STAFF')")
public PurchaseOrder getPurchaseOrder(@PathVariable Long id) {
    return purchaseOrderService.getOrder(id);
}
    // =========================================
    // GET SUPPLIER PURCHASE ORDERS
    // =========================================

    @GetMapping("/supplier/{supplierId:\\d+}")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
public List<PurchaseOrder> getSupplierPurchaseOrders(
        @PathVariable Long supplierId) {

    return purchaseOrderService.getSupplierOrders(supplierId);
}

    // =========================================
    // GET PURCHASE ORDER ITEMS
    // Staff can view items for receiving
    // =========================================

    @GetMapping("/{purchaseOrderId}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'SUPPLIER', 'STAFF')")
    public List<PurchaseOrderItem> getPurchaseOrderItems(
            @PathVariable Long purchaseOrderId) {

        return purchaseOrderService.getOrderItems(purchaseOrderId);
    }

    // =========================================
    // GET APPROVED ORDERS READY FOR RECEIVING
    // =========================================

    @GetMapping("/ready-to-receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public List<PurchaseOrder> getOrdersReadyToReceive() {

        return purchaseOrderService.getOrdersReadyToReceive();
    }

    // =========================================
    // RECEIVE MEDICINES INTO INVENTORY
    // =========================================

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public PurchaseOrder receivePurchaseOrder(
            @PathVariable Long id,
            @RequestBody ReceivePurchaseOrderRequest request,
            Authentication authentication) {

        PurchaseOrder receivedOrder =
                purchaseOrderService.receiveOrder(id, request);
        notificationService.notifySupplierOrderStatus(receivedOrder);
        
        auditService.record(
                "RECEIVE",
                "PURCHASE_ORDER",
                id,
                "Purchase order #" + id
                        + " received by " + authentication.getName()
        );

        return receivedOrder;
    }

    // =========================================
    // CREATE PURCHASE ORDER
    // Admin and Pharmacist only
    // =========================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public PurchaseOrder createPurchaseOrder(
            @RequestBody PurchaseOrderRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"
                ));

        PurchaseOrder order = purchaseOrderService.createOrder(
                request,
                user.getUserId()
        );

        // Notify supplier that a new purchase order has been placed
notificationService.notifySupplierOrderStatus(order);

        auditService.record(
                "CREATE",
                "PURCHASE_ORDER",
                order.getPurchaseOrderId(),
                "Raised PO #" + order.getPurchaseOrderId()
                        + " for supplier #" + order.getSupplierId()
                        + " total ₹" + order.getTotalAmount()
        );

        return order;
    }

    // =========================================
    // UPDATE PURCHASE ORDER STATUS
    // Admin only
    // =========================================

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public PurchaseOrder updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request,
            Authentication authentication) {



        String newStatus = request.getStatus() == null
                ? ""
                : request.getStatus().trim().toUpperCase();

        if (!newStatus.equals("APPROVED")
                && !newStatus.equals("CANCELLED")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be APPROVED or CANCELLED"
            );
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"
                ));

        PurchaseOrder order = purchaseOrderService.getOrder(id);

        String currentStatus = order.getStatus() == null
                ? ""
                : order.getStatus().trim().toUpperCase();

        boolean validTransition =
                (currentStatus.equals("PENDING")
                        && (newStatus.equals("APPROVED")
                        || newStatus.equals("CANCELLED")))
                ||
                (currentStatus.equals("APPROVED")
                        && newStatus.equals("CANCELLED"))
                ||
                (currentStatus.equals("PARTIALLY_RECEIVED")
                        && newStatus.equals("CANCELLED"));

        if (!validTransition) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot change purchase order status from "
                            + currentStatus + " to " + newStatus
            );
        }

        order.setStatus(newStatus);

        PurchaseOrder savedOrder =
        purchaseOrderService.saveOrder(order);

// Notify the supplier about the status change
notificationService.notifySupplierOrderStatus(savedOrder);

auditService.record(
        "UPDATE",
        "PURCHASE_ORDER",
        id,
        "Admin #" + user.getUserId()
                + " changed PO #" + id
                + " from " + currentStatus
                + " to " + newStatus
);

return savedOrder;
    }

    // =========================================
    // STATUS REQUEST DTO
    // =========================================

    public static class StatusRequest {

        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }





    // GET PURCHASE ORDERS FOR LOGGED-IN SUPPLIER
// GET PURCHASE ORDERS FOR LOGGED-IN SUPPLIER
@GetMapping("/my-orders")
@PreAuthorize("hasRole('SUPPLIER')")
public List<PurchaseOrder> getMySupplierOrders(
        Authentication authentication) {

    System.out.println("Logged-in email: " + authentication.getName());

    Supplier supplier = supplierRepository
            .findByEmailIgnoreCase(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Supplier account not found"
            ));

    System.out.println("Supplier ID: " + supplier.getSupplierId());

    List<PurchaseOrder> orders =
            purchaseOrderService.getSupplierOrders(
                    supplier.getSupplierId()
            );

    System.out.println("Orders found: " + orders.size());

    return orders;
}
}
