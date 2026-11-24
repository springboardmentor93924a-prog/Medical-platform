package com.medistock.medistock.controller;

import com.medistock.medistock.dto.*;
import com.medistock.medistock.entity.FefoAllocation;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.service.CurrentUserService;
import com.medistock.medistock.service.FefoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fefo")
public class FefoController {

    private final FefoService fefoService;
    private final CurrentUserService currentUserService;

    public FefoController(FefoService fefoService, CurrentUserService currentUserService) {
        this.fefoService = fefoService;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieve batch inventory enriched with FEFO ranks, eligibility status, and expiry windows.
     */
    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<List<FefoBatchDto>>> getBatches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer medicineId,
            @RequestParam(required = false) String filter) {

        List<FefoBatchDto> batches = fefoService.getBatchesWithFefo(search, medicineId, filter);
        return ResponseEntity.ok(ApiResponse.ok(batches));
    }

    /**
     * Get automated FEFO batch recommendation for dispensing.
     * Evaluates earliest expiring batches and suggests single or multi-batch allocation plan.
     */
    @GetMapping("/recommendation")
    public ResponseEntity<ApiResponse<FefoRecommendationDto>> getRecommendation(
            @RequestParam Integer medicineId,
            @RequestParam(defaultValue = "1") Integer quantity,
            @RequestParam(required = false) Integer selectedBatchId) {

        if (medicineId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Medicine ID is required"));
        }

        try {
            FefoRecommendationDto recommendation = fefoService.getRecommendation(medicineId, quantity, selectedBatchId);
            return ResponseEntity.ok(ApiResponse.ok(recommendation));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Concurrency-safe FEFO stock allocation and dispensing endpoint.
     * Deducts stock, creates allocation and audit log records.
     * Prevents allocation of expired or quarantined batches.
     */
    @PostMapping("/allocate")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<ApiResponse<List<FefoAllocation>>> allocateStock(
            @RequestBody FefoAllocationRequest request,
            HttpServletRequest httpRequest) {

        try {
            Integer userId = currentUserService.getCurrentUserId();
            List<FefoAllocation> allocations = fefoService.allocateStock(request, userId, httpRequest);
            return ResponseEntity.ok(ApiResponse.ok("FEFO stock allocation completed successfully", allocations));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Allocation failed: " + e.getMessage()));
        }
    }

    /**
     * Get FEFO compliance metrics, trends, expiry summary, and alerts.
     */
    @GetMapping("/compliance-report")
    public ResponseEntity<ApiResponse<FefoComplianceReportDto>> getComplianceReport() {
        FefoComplianceReportDto report = fefoService.getComplianceReport();
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    /**
     * Retrieve batch allocation history with FEFO compliance indicators.
     */
    @GetMapping("/allocations")
    public ResponseEntity<ApiResponse<List<FefoAllocation>>> getAllocationHistory(
            @RequestParam(required = false) Integer medicineId,
            @RequestParam(required = false) Boolean compliantOnly,
            @RequestParam(defaultValue = "50") int limit) {

        List<FefoAllocation> list = fefoService.getAllocationHistory(medicineId, compliantOnly, limit);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Quick KPI summary for FEFO dashboard cards.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFefoStats() {
        FefoComplianceReportDto report = fefoService.getComplianceReport();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBatches", report.getTotalBatches());
        stats.put("eligibleBatches", report.getEligibleBatches());
        stats.put("nearExpiryBatches", report.getNearExpiryBatches());
        stats.put("expiredBatches", report.getExpiredBatches());
        stats.put("complianceRate", report.getComplianceRate());
        stats.put("totalAllocations", report.getTotalAllocations());
        stats.put("compliantAllocations", report.getCompliantAllocations());
        stats.put("overriddenAllocations", report.getOverriddenAllocations());
        stats.put("totalUnitsAllocated", report.getTotalUnitsAllocated());
        stats.put("nearExpiryUnitsSalvaged", report.getNearExpiryUnitsSalvaged());

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    /**
     * Quarantine or update batch status (e.g. suspect lot or recall).
     */
    @PatchMapping("/batches/{batchId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<InventoryBatch>> updateBatchStatus(
            @PathVariable Integer batchId,
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {

        String newStatus = body.getOrDefault("status", "QUARANTINED");
        String reason = body.getOrDefault("reason", "Manual batch status change");

        try {
            Integer userId = currentUserService.getCurrentUserId();
            InventoryBatch updated = fefoService.updateBatchStatus(batchId, newStatus, reason, userId, httpRequest);
            return ResponseEntity.ok(ApiResponse.ok("Batch status updated to " + newStatus, updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}

