package com.medistock.controller;

import com.medistock.entity.AuditLog;
import com.medistock.repository.AuditLogRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/actions")
    public List<String> actions() {
        return List.of("CREATE", "UPDATE", "DELETE",
                "ACTIVATE", "DEACTIVATE", "LOGIN", "REGISTER",
                "STOCK_IN", "STOCK_OUT", "REPORT_GENERATED");
    }

    @GetMapping
    public Map<String, Object> getAuditLogs(
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLog> result = auditLogRepository.search(
                action == null ? "" : action.trim(),
                q == null ? "" : q.trim(),
                PageRequest.of(
                        Math.max(page, 0),
                        Math.min(Math.max(size, 1), 100),
                        Sort.by("auditId").descending()));

        List<Map<String, Object>> content = result.getContent()
                .stream()
                .map(log -> Map.<String, Object>of(
                        "auditId", log.getAuditId(),
                        "userId", log.getUserId() == null ? 0 : log.getUserId(),
                        "action", log.getAction(),
                        "entityType", log.getEntityType(),
                        "entityId", log.getEntityId() == null ? 0 : log.getEntityId(),
                        "summary", log.getSummary() == null ? "" : log.getSummary(),
                        "performedBy", log.getPerformedBy() == null ? "" : log.getPerformedBy(),
                        "createdAt", log.getCreatedAt() == null ? "" : log.getCreatedAt().toString()))
                .toList();

        return Map.of(
                "content", content,
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "number", result.getNumber());
    }
}
