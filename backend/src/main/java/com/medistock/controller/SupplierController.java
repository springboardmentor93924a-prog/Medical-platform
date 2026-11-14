package com.medistock.controller;

import com.medistock.dto.request.OrderStatusUpdateRequest;
import com.medistock.dto.request.SupplierRequest;
import com.medistock.dto.request.UpdateProfileRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.Medicine;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.Supplier;
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

import java.util.List;

@RestController
public class SupplierController {

    private final SupplierService supplierService;
    private final PurchaseOrderService purchaseOrderService;

    public SupplierController(SupplierService supplierService, PurchaseOrderService purchaseOrderService) {
        this.supplierService = supplierService;
        this.purchaseOrderService = purchaseOrderService;
    }

    // ==========================================
    // Administrative / Staff Supplier Endpoints
    // ==========================================

    @GetMapping("/api/v1/suppliers")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<List<Supplier>>> getAllSuppliers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) com.medistock.enums.SupplierStatus status) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getAllSuppliers(search, status)));
    }

    @PatchMapping("/api/v1/suppliers/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplierStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody com.medistock.dto.request.SupplierStatusUpdateRequest request) {
        Supplier updated = supplierService.updateSupplierStatus(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Supplier status updated successfully", updated));
    }

    @GetMapping("/api/v1/suppliers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<Supplier>> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSupplierById(id)));
    }

    @PostMapping("/api/v1/suppliers")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Supplier>> createSupplier(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupplierRequest request) {
        Supplier created = supplierService.createSupplier(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Supplier registered successfully", created));
    }

    @PutMapping("/api/v1/suppliers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplier(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupplierRequest request) {
        Supplier updated = supplierService.updateSupplier(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Supplier information updated successfully", updated));
    }

    @DeleteMapping("/api/v1/suppliers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteSupplier(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        supplierService.deleteSupplier(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Supplier deleted successfully", null));
    }

    @GetMapping("/api/v1/suppliers/{id}/medicines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<List<Medicine>>> getSuppliedMedicines(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSuppliedMedicines(id)));
    }

    @GetMapping("/api/v1/suppliers/{id}/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Page<PurchaseOrder>>> getSupplierOrders(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSupplierOrders(id, pageable)));
    }

    // ==========================================
    // Dedicated Supplier Role Endpoints (Strict Data Isolation)
    // ==========================================

    @GetMapping("/api/v1/supplier/profile")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<Supplier>> getMySupplierProfile(@AuthenticationPrincipal UserDetails userDetails) {
        Supplier supplier = supplierService.getSupplierByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(supplier));
    }

    @PutMapping("/api/v1/supplier/profile")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<Supplier>> updateMySupplierProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        Supplier updated = supplierService.updateSupplierOwnProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Supplier profile updated successfully", updated));
    }

    @GetMapping("/api/v1/supplier/orders")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<Page<PurchaseOrder>>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Supplier supplier = supplierService.getSupplierByUserEmail(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSupplierOrders(supplier.getId(), pageable)));
    }

    @GetMapping("/api/v1/supplier/medicines")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<List<Medicine>>> getMyMedicines(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) com.medistock.enums.MedicineStatus status) {
        Supplier supplier = supplierService.getSupplierByUserEmail(userDetails.getUsername());
        String searchQuery = (query != null && !query.isBlank()) ? query : search;
        List<Medicine> medicines = supplierService.getSuppliedMedicines(
                supplier.getId(),
                supplier.getCompanyName(),
                searchQuery,
                categoryId,
                status
        );
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }

    @PatchMapping("/api/v1/supplier/orders/{id}/status")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> updateOrderStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        PurchaseOrder updated = purchaseOrderService.updateOrderStatusBySupplier(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully to " + request.getStatus().name(), updated));
    }
}
