package com.medistock.controller;

import com.medistock.dto.request.OrderStatusUpdateRequest;
import com.medistock.dto.request.PurchaseOrderRequest;
import com.medistock.dto.request.ReceiveStockRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.Supplier;
import com.medistock.enums.OrderStatus;
import com.medistock.service.PurchaseOrderService;
import com.medistock.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final SupplierService supplierService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService, SupplierService supplierService) {
        this.purchaseOrderService = purchaseOrderService;
        this.supplierService = supplierService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrder created = purchaseOrderService.createOrder(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase order created successfully", created));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<Page<PurchaseOrder>>> getAllOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // If authenticated user is a SUPPLIER, strictly isolate by their own supplier ID
        boolean isSupplier = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPPLIER"));
        if (isSupplier) {
            Supplier ownSupplier = supplierService.getSupplierByUserEmail(userDetails.getUsername());
            supplierId = ownSupplier.getId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.getAllOrders(supplierId, status, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.getOrderById(id, userDetails.getUsername())));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> approveOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        PurchaseOrder approved = purchaseOrderService.approveOrder(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Purchase order approved successfully", approved));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> rejectOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean isSupplier = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPPLIER"));

        PurchaseOrder rejected;
        if (isSupplier) {
            rejected = purchaseOrderService.rejectOrderBySupplier(id, reason, userDetails.getUsername());
        } else {
            rejected = purchaseOrderService.rejectOrderByAdmin(id, reason, userDetails.getUsername());
        }
        return ResponseEntity.ok(ApiResponse.success("Purchase order rejected", rejected));
    }

    @PatchMapping({"/accept", "/{id}/accept", "/{id}/supplier/accept"})
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> acceptOrderBySupplier(
            @PathVariable(required = false) Long id,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails) {
        PurchaseOrder accepted = purchaseOrderService.acceptOrderBySupplier(id, notes, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Purchase order accepted successfully", accepted));
    }

    @PatchMapping("/{id}/supplier/reject")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> rejectOrderBySupplier(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        PurchaseOrder rejected = purchaseOrderService.rejectOrderBySupplier(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Purchase order rejected by supplier", rejected));
    }

    @PatchMapping("/{id}/supplier/status")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> updateStatusBySupplier(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        PurchaseOrder updated = purchaseOrderService.updateOrderStatusBySupplier(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully to " + request.getStatus().name(), updated));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> receiveStock(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReceiveStockRequest request) {
        PurchaseOrder received = purchaseOrderService.receiveOrderStock(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Stock received and inventory successfully updated", received));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        PurchaseOrder cancelled = purchaseOrderService.cancelOrder(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Purchase order cancelled", cancelled));
    }
}
