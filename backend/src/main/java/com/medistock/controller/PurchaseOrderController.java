
package com.medistock.controller;

import com.medistock.dto.PurchaseOrderRequest;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.PurchaseOrderItem;
import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditService;
import com.medistock.service.PurchaseOrderService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping({"/api/purchase-orders", "/api/admin/purchase-orders"})
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public PurchaseOrderController(
            PurchaseOrderService purchaseOrderService,
            UserRepository userRepository,
            AuditService auditService) {
        this.purchaseOrderService = purchaseOrderService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderService.getAllOrders();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'SUPPLIER')")
    public PurchaseOrder getPurchaseOrder(@PathVariable Long id) {
        return purchaseOrderService.getOrder(id);
    }

    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'SUPPLIER')")
    public List<PurchaseOrder> getSupplierPurchaseOrders(
            @PathVariable Long supplierId) {
        return purchaseOrderService.getSupplierOrders(supplierId);
    }

    @GetMapping("/{purchaseOrderId}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'SUPPLIER')")
    public List<PurchaseOrderItem> getPurchaseOrderItems(
            @PathVariable Long purchaseOrderId) {
        return purchaseOrderService.getOrderItems(purchaseOrderId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public PurchaseOrder createPurchaseOrder(
            @RequestBody PurchaseOrderRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"));

        PurchaseOrder order = purchaseOrderService.createOrder(
                request, user.getUserId());

        auditService.record(
                "CREATE",
                "PURCHASE_ORDER",
                order.getPurchaseOrderId(),
                "Raised PO #" + order.getPurchaseOrderId()
                        + " for supplier #" + order.getSupplierId()
                        + " total ₹" + order.getTotalAmount());

        return order;
    }

    // ADMIN ONLY: Approve, receive or cancel an order
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public PurchaseOrder updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request,
            Authentication authentication) {

        // Validate requested status
        String newStatus = request.getStatus() == null
                ? ""
                : request.getStatus().trim().toUpperCase();

        if (!newStatus.equals("APPROVED")
                && !newStatus.equals("RECEIVED")
                && !newStatus.equals("CANCELLED")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be APPROVED, RECEIVED or CANCELLED");
        }

        // Find authenticated admin
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"));

        // Find purchase order
        PurchaseOrder order = purchaseOrderService.getOrder(id);

        String currentStatus = order.getStatus() == null
                ? ""
                : order.getStatus().trim().toUpperCase();

        // Validate allowed status transitions
        boolean validTransition =
                (currentStatus.equals("PENDING")
                        && (newStatus.equals("APPROVED")
                        || newStatus.equals("CANCELLED")))
                ||
                (currentStatus.equals("APPROVED")
                        && (newStatus.equals("RECEIVED")
                        || newStatus.equals("CANCELLED")));

        if (!validTransition) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot change purchase order status from "
                            + currentStatus + " to " + newStatus);
        }

        // Update order status
        order.setStatus(newStatus);

        PurchaseOrder savedOrder =
                purchaseOrderService.saveOrder(order);

        // Record audit information
        auditService.record(
                "UPDATE",
                "PURCHASE_ORDER",
                id,
                "Admin #" + user.getUserId()
                        + " changed PO #" + id
                        + " from " + currentStatus
                        + " to " + newStatus);

        return savedOrder;
    }

    public static class StatusRequest {

        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
