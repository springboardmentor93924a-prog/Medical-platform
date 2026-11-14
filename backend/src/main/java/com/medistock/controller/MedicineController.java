package com.medistock.controller;

import com.medistock.dto.request.MedicineRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.Medicine;
import com.medistock.enums.MedicineStatus;
import com.medistock.entity.Supplier;
import com.medistock.service.MedicineService;
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
@RequestMapping("/api/v1/medicines")
public class MedicineController {

    private final MedicineService medicineService;
    private final SupplierService supplierService;

    public MedicineController(MedicineService medicineService, SupplierService supplierService) {
        this.medicineService = medicineService;
        this.supplierService = supplierService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<Page<Medicine>>> searchMedicines(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) MedicineStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        String searchQuery = (query != null && !query.isBlank()) ? query : search;

        // Strict supplier data isolation: if caller is a SUPPLIER, force filter by their own supplier ID
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPPLIER"))) {
            try {
                Supplier supplier = supplierService.getSupplierByUserEmail(userDetails.getUsername());
                supplierId = supplier.getId();
            } catch (Exception e) {
                return ResponseEntity.ok(ApiResponse.success(Page.empty()));
            }
        }

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Medicine> result = medicineService.searchMedicines(searchQuery, categoryId, supplierId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<Medicine>> getMedicineById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Medicine med = medicineService.getMedicineById(id);
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPPLIER"))) {
            Supplier supplier = supplierService.getSupplierByUserEmail(userDetails.getUsername());
            if (med.getSupplier() == null || !med.getSupplier().getId().equals(supplier.getId())) {
                throw new com.medistock.exception.ForbiddenException("Access denied: You can only view medicines supplied by your organization.");
            }
        }
        return ResponseEntity.ok(ApiResponse.success(med));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Medicine>> createMedicine(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MedicineRequest request) {
        Medicine created = medicineService.createMedicine(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Medicine added to inventory successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Medicine>> updateMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MedicineRequest request) {
        Medicine updated = medicineService.updateMedicine(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Medicine details updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<String>> deleteMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        medicineService.deleteMedicine(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Medicine archived successfully", null));
    }

    @GetMapping("/alerts/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Medicine>>> getLowStockMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getLowStockMedicines()));
    }

    @GetMapping("/alerts/out-of-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Medicine>>> getOutOfStockMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getOutOfStockMedicines()));
    }

    @GetMapping("/alerts/near-expiry")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Medicine>>> getNearExpiryMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getNearExpiryMedicines()));
    }

    @GetMapping("/alerts/expired")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Medicine>>> getExpiredMedicines() {
        return ResponseEntity.ok(ApiResponse.success(medicineService.getExpiredMedicines()));
    }
}
