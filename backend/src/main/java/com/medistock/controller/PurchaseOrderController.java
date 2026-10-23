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
                        HttpStatus.UNAUTHORIZED, "Authenticated user not found"));

        PurchaseOrder order = purchaseOrderService.createOrder(
                request, user.getUserId());

        auditService.record("CREATE", "PURCHASE_ORDER",
                order.getPurchaseOrderId(),
                "Raised PO #" + order.getPurchaseOrderId()
                        + " for supplier #" + order.getSupplierId()
                        + " total ₹" + order.getTotalAmount());

        return order;
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public PurchaseOrder updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {

        PurchaseOrder order = purchaseOrderService.getOrder(id);

        String status = request.getStatus() == null
                ? ""
                : request.getStatus().trim().toUpperCase();

        if (!status.equals("PENDING") && !status.equals("APPROVED")
                && !status.equals("RECEIVED") && !status.equals("CANCELLED")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status must be PENDING, APPROVED, RECEIVED or CANCELLED");
        }

        order.setStatus(status);
        PurchaseOrder saved = purchaseOrderService.saveOrder(order);

        auditService.record("UPDATE", "PURCHASE_ORDER", id,
                "PO #" + id + " marked " + status);

        return saved;
    }

    public static class StatusRequest {
        private String status;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
