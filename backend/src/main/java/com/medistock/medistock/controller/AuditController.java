package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.audit.*;
import com.medistock.medistock.entity.AuditAlert;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.service.AuditAlertService;
import com.medistock.medistock.service.AuditIntegrityService;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AuditController {

    private final AuditService auditService;
    private final AuditIntegrityService auditIntegrityService;
    private final AuditAlertService auditAlertService;
    private final CurrentUserService currentUserService;

    public AuditController(AuditService auditService,
                           AuditIntegrityService auditIntegrityService,
                           AuditAlertService auditAlertService,
                           CurrentUserService currentUserService) {
        this.auditService = auditService;
        this.auditIntegrityService = auditIntegrityService;
        this.auditAlertService = auditAlertService;
        this.currentUserService = currentUserService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ADMIN AUDIT LOGS ENDPOINTS (Strictly Admin-Only)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/admin/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        AuditFilterRequest filter = new AuditFilterRequest();
        filter.setSearch(search);
        filter.setRole(role);
        filter.setModule(module);
        filter.setAction(action);
        filter.setStatus(status);
        filter.setUserId(userId);
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);

        Page<AuditLogDto> result = auditService.getAuditLogs(filter, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/admin/audit-logs/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuditLogDto>> getAuditLogByEventId(@PathVariable String eventId) {
        return auditService.getAuditLogByEventId(eventId)
                .map(log -> ResponseEntity.ok(ApiResponse.ok(log)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/audit-logs/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getUserActivityTimeline(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogDto> result = auditService.getUserActivityTimeline(userId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/admin/audit-logs/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuditSummaryDto>> getAuditSummary() {
        return ResponseEntity.ok(ApiResponse.ok(auditService.getAuditSummary()));
    }

    @GetMapping("/admin/audit-logs/integrity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuditIntegrityReportDto>> verifyLedgerIntegrity() {
        return ResponseEntity.ok(ApiResponse.ok(auditIntegrityService.verifyLedgerIntegrity()));
    }

    @PostMapping("/admin/audit-logs/rebuild-chain")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuditIntegrityReportDto>> rebuildChain() {
        return ResponseEntity.ok(ApiResponse.ok(auditIntegrityService.repairOrInitializeLedger()));
    }

    @GetMapping("/admin/audit-alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditAlert>>> getSecurityAlerts() {
        return ResponseEntity.ok(ApiResponse.ok(auditAlertService.getRecentAlerts()));
    }

    @PatchMapping("/admin/audit-alerts/{alertId}/acknowledge")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuditAlert>> acknowledgeAlert(@PathVariable Integer alertId) {
        User admin = currentUserService.getCurrentUser().orElse(null);
        String adminEmail = admin != null ? admin.getEmail() : "admin@medistock.com";
        AuditAlert acknowledged = auditAlertService.acknowledgeAlert(alertId, adminEmail);
        return ResponseEntity.ok(ApiResponse.ok("Security alert acknowledged", acknowledged));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. USER OWN-ACTIVITY ENDPOINT (Pharmacist & Staff restricted to own logs)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/my-activity")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getMyActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Integer currentUserId = currentUserService.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Authenticated user context missing"));
        }
        Page<AuditLogDto> myLogs = auditService.getUserActivityTimeline(currentUserId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(myLogs));
    }
}
