package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.returns.CreateReturnRequest;
import com.medistock.medistock.dto.returns.ResolveReturnRequest;
import com.medistock.medistock.dto.returns.ReturnAnalyticsDto;
import com.medistock.medistock.dto.returns.SubmitInspectionRequest;
import com.medistock.medistock.entity.MedicineReturn;
import com.medistock.medistock.entity.ReturnInspection;
import com.medistock.medistock.service.CurrentUserService;
import com.medistock.medistock.service.MedicineReturnService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class MedicineReturnController {

    private final MedicineReturnService returnService;
    private final CurrentUserService currentUserService;

    public MedicineReturnController(MedicineReturnService returnService,
                                    CurrentUserService currentUserService) {
        this.returnService = returnService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicineReturn>>> getReturns() {
        Integer userId = currentUserService.getCurrentUserId();
        String role = currentUserService.getCurrentUserRole();
        Integer supplierId = currentUserService.getSupplierForCurrentUser()
                .map(com.medistock.medistock.entity.Supplier::getSupplierId).orElse(null);

        List<MedicineReturn> list = returnService.getReturnsForUser(userId, role, supplierId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineReturn>> getReturnById(@PathVariable Integer id) {
        MedicineReturn ret = returnService.getReturnById(id);

        // Cross-Supplier tenant isolation guard
        if (currentUserService.hasRole("SUPPLIER")) {
            Integer supplierId = currentUserService.getSupplierForCurrentUser()
                    .map(com.medistock.medistock.entity.Supplier::getSupplierId).orElse(null);
            if (ret.getSupplier() == null || !ret.getSupplier().getSupplierId().equals(supplierId)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Access denied: You are not authorized to view this supplier return"));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(ret));
    }

    @GetMapping("/{id}/inspections")
    public ResponseEntity<ApiResponse<List<ReturnInspection>>> getInspections(@PathVariable Integer id) {
        List<ReturnInspection> list = returnService.getInspections(id);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<MedicineReturn>> createReturn(
            @Valid @RequestBody CreateReturnRequest req,
            HttpServletRequest request) {

        Integer userId = currentUserService.getCurrentUserId();
        String role = currentUserService.getCurrentUserRole();

        MedicineReturn saved = returnService.createReturn(req, userId, role, request);
        return ResponseEntity.ok(ApiResponse.ok("Medicine return registered into Quarantine", saved));
    }

    @PostMapping("/{id}/inspections")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<ReturnInspection>> submitInspection(
            @PathVariable Integer id,
            @Valid @RequestBody SubmitInspectionRequest req,
            HttpServletRequest request) {

        Integer userId = currentUserService.getCurrentUserId();
        ReturnInspection inspection = returnService.submitInspection(id, req, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Quality inspection completed", inspection));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineReturn>> resolveReturn(
            @PathVariable Integer id,
            @Valid @RequestBody ResolveReturnRequest req,
            HttpServletRequest request) {

        Integer userId = currentUserService.getCurrentUserId();
        MedicineReturn resolved = returnService.resolveReturn(id, req, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Return resolution completed: " + resolved.getStatus(), resolved));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<ReturnAnalyticsDto>> getAnalytics() {
        ReturnAnalyticsDto analytics = returnService.getAnalytics();
        return ResponseEntity.ok(ApiResponse.ok(analytics));
    }
}
