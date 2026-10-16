package com.medistock.controller;

import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.PurchaseOrderItem;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.PurchaseOrderItemRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@CrossOrigin(origins = "http://localhost:5173")
public class PurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;

    public PurchaseOrderController(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderItemRepository purchaseOrderItemRepository) {

        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
    }

    // Get all purchase orders
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    // Get purchase orders for a particular supplier
    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'SUPPLIER')")
    public List<PurchaseOrder> getSupplierPurchaseOrders(
            @PathVariable Long supplierId) {

        return purchaseOrderRepository.findBySupplierId(supplierId);
    }

    // Get items inside a particular purchase order
    @GetMapping("/{purchaseOrderId}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'SUPPLIER')")
    public List<PurchaseOrderItem> getPurchaseOrderItems(
            @PathVariable Long purchaseOrderId) {

        return purchaseOrderItemRepository
                .findByPurchaseOrderId(purchaseOrderId);
    }
}