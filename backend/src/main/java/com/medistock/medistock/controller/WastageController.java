package com.medistock.medistock.controller;

import com.medistock.medistock.dto.*;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.entity.WastageRecord;
import com.medistock.medistock.service.CurrentUserService;
import com.medistock.medistock.service.WastageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wastage")
public class WastageController {

    private final WastageService wastageService;
    private final CurrentUserService currentUserService;

    public WastageController(WastageService wastageService, CurrentUserService currentUserService) {
        this.wastageService = wastageService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/records")
    public ResponseEntity<ApiResponse<List<WastageRecord>>> getAllRecords() {
        return ResponseEntity.ok(ApiResponse.ok(wastageService.getAllRecords()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<List<WastageRecord>>> getPendingApprovals() {
        return ResponseEntity.ok(ApiResponse.ok(wastageService.getPendingApprovals()));
    }

    @GetMapping("/my-reports")
    public ResponseEntity<ApiResponse<List<WastageRecord>>> getMyReports() {
        Integer userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.ok(wastageService.getMyReports(userId)));
    }

    @PostMapping("/report")
    @PreAuthorize("hasAnyRole('STAFF', 'PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<WastageRecord>> createReport(
            @RequestBody CreateWastageRequest request,
            HttpServletRequest httpRequest) {
        try {
            User user = currentUserService.getCurrentUser().orElse(null);
            Integer userId = user != null ? user.getUserId() : null;
            String userName = user != null ? user.getFullName() : "Staff";
            String roleName = user != null && user.getRole() != null ? user.getRole().getRoleName() : "Staff";

            WastageRecord saved = wastageService.createReport(request, userId, userName, roleName, httpRequest);
            return ResponseEntity.ok(ApiResponse.ok("Wastage report submitted successfully", saved));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<WastageRecord>> verifyReport(
            @PathVariable Integer id,
            @RequestBody VerifyWastageRequest request,
            HttpServletRequest httpRequest) {
        try {
            User user = currentUserService.getCurrentUser().orElse(null);
            Integer userId = user != null ? user.getUserId() : null;
            String userName = user != null ? user.getFullName() : "Pharmacist";

            WastageRecord verified = wastageService.verifyReport(id, request, userId, userName, httpRequest);
            return ResponseEntity.ok(ApiResponse.ok("Wastage report verified and routed for Admin approval", verified));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WastageRecord>> processApproval(
            @PathVariable Integer id,
            @RequestBody ApprovalWastageRequest request,
            HttpServletRequest httpRequest) {
        try {
            User user = currentUserService.getCurrentUser().orElse(null);
            Integer adminId = user != null ? user.getUserId() : null;
            String adminName = user != null ? user.getFullName() : "Administrator";

            WastageRecord approved = wastageService.processApproval(id, request, adminId, adminName, httpRequest);
            String msg = "APPROVE".equalsIgnoreCase(request.getAction())
                    ? "Wastage write-off approved and stock deducted permanently."
                    : "Wastage report rejected.";
            return ResponseEntity.ok(ApiResponse.ok(msg, approved));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<WastageAnalyticsDto>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.ok(wastageService.getAnalytics()));
    }
}
