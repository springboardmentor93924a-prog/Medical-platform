package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.PurchaseOrderRepository;
import com.medistock.medistock.repository.SupplierRepository;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;

    public SupplierController(SupplierRepository supplierRepository,
                              PurchaseOrderRepository purchaseOrderRepository,
                              InventoryBatchRepository inventoryBatchRepository,
                              AuditService auditService,
                              CurrentUserService currentUserService) {
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.auditService = auditService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSuppliers(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {

        List<Supplier> suppliers = activeOnly ?
                supplierRepository.findByActiveTrue() :
                supplierRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Supplier s : suppliers) {
            long orderCount = purchaseOrderRepository.countBySupplierId(s.getSupplierId());
            List<PurchaseOrder> orders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(s.getSupplierId());
            BigDecimal totalSpent = orders.stream()
                    .map(PurchaseOrder::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("supplierId", s.getSupplierId());
            map.put("supplierName", s.getSupplierName());
            map.put("contactPerson", s.getContactPerson());
            map.put("phone", s.getPhone());
            map.put("email", s.getEmail());
            map.put("address", s.getAddress());
            map.put("active", s.getActive());
            map.put("createdAt", s.getCreatedAt());
            map.put("orderCount", orderCount);
            map.put("totalSpent", totalSpent);
            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupplierById(@PathVariable Integer id) {
        Optional<Supplier> sOpt = supplierRepository.findById(id);
        if (sOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Supplier s = sOpt.get();
        List<PurchaseOrder> orders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(id);
        BigDecimal totalSpent = orders.stream()
                .map(PurchaseOrder::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<InventoryBatch> allBatches = inventoryBatchRepository.findAll();
        Set<String> suppliedMeds = new HashSet<>();
        for (InventoryBatch b : allBatches) {
            if (id.equals(b.getSupplierId()) && b.getMedicine() != null) {
                suppliedMeds.add(b.getMedicine().getMedicineName());
            }
        }

        Map<String, Object> map = new HashMap<>();
        map.put("supplierId", s.getSupplierId());
        map.put("supplierName", s.getSupplierName());
        map.put("contactPerson", s.getContactPerson());
        map.put("phone", s.getPhone());
        map.put("email", s.getEmail());
        map.put("address", s.getAddress());
        map.put("active", s.getActive());
        map.put("createdAt", s.getCreatedAt());
        map.put("totalSpent", totalSpent);
        map.put("orders", orders);
        map.put("suppliedMedicines", suppliedMeds);

        return ResponseEntity.ok(ApiResponse.ok(map));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Supplier>> createSupplier(
            @RequestBody Supplier supplier,
            HttpServletRequest request) {

        if (supplier.getSupplierName() == null || supplier.getSupplierName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Supplier name is required"));
        }

        supplier.setSupplierName(supplier.getSupplierName().trim());
        Supplier saved = supplierRepository.save(supplier);
        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "CREATE_SUPPLIER",
                "SUPPLIER",
                saved.getSupplierId(),
                "Created medical supplier: " + saved.getSupplierName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Supplier created successfully", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplier(
            @PathVariable Integer id,
            @RequestBody Supplier updateData,
            HttpServletRequest request) {

        Optional<Supplier> sOpt = supplierRepository.findById(id);
        if (sOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Supplier s = sOpt.get();
        if (updateData.getSupplierName() != null && !updateData.getSupplierName().trim().isEmpty()) {
            s.setSupplierName(updateData.getSupplierName().trim());
        }
        if (updateData.getContactPerson() != null) s.setContactPerson(updateData.getContactPerson().trim());
        if (updateData.getPhone() != null) s.setPhone(updateData.getPhone().trim());
        if (updateData.getEmail() != null) s.setEmail(updateData.getEmail().trim());
        if (updateData.getAddress() != null) s.setAddress(updateData.getAddress().trim());
        if (updateData.getActive() != null) s.setActive(updateData.getActive());

        Supplier saved = supplierRepository.save(s);
        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "UPDATE_SUPPLIER",
                "SUPPLIER",
                saved.getSupplierId(),
                "Updated details for supplier: " + saved.getSupplierName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Supplier updated successfully", saved));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Supplier>> toggleSupplierStatus(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Boolean> body,
            HttpServletRequest request) {

        Optional<Supplier> sOpt = supplierRepository.findById(id);
        if (sOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Supplier s = sOpt.get();
        boolean newActive = (body != null && body.containsKey("active"))
                ? body.get("active")
                : !Boolean.TRUE.equals(s.getActive());

        s.setActive(newActive);
        Supplier saved = supplierRepository.save(s);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "UPDATE_SUPPLIER_STATUS",
                "SUPPLIER",
                saved.getSupplierId(),
                (newActive ? "Activated" : "Deactivated") + " supplier: " + saved.getSupplierName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Supplier status updated", saved));
    }
}
