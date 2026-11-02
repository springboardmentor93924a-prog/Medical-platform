
package com.medistock.controller;

import com.medistock.entity.SystemMonitoring;
import com.medistock.repository.SystemMonitoringRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class SystemMonitoringController {

    private final SystemMonitoringRepository repository;

    public SystemMonitoringController(SystemMonitoringRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/actions")
    public List<String> actions() {
        return List.of(
                "CREATE", "UPDATE", "DELETE",
                "ACTIVATE", "DEACTIVATE", "LOGIN", "REGISTER",
                "STOCK_IN", "STOCK_OUT", "REPORT_GENERATED"
        );
    }

    @GetMapping
    public Map<String, Object> getSystemMonitoring(
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<SystemMonitoring> result = repository.search(
                action == null ? "" : action.trim(),
                q == null ? "" : q.trim(),
                PageRequest.of(
                        Math.max(page, 0),
                        Math.min(Math.max(size, 1), 100),
                        Sort.by("auditId").descending()
                )
        );

        List<Map<String, Object>> content = result.getContent()
                .stream()
                .map(log -> {
                    Map<String, Object> row = new HashMap<>();

                    row.put("auditId", log.getAuditId());
                    row.put("userId", log.getUserId() == null ? 0 : log.getUserId());
                    row.put("action", log.getAction());
                    row.put("entityType", log.getEntityType());
                    row.put("entityId", log.getEntityId() == null ? 0 : log.getEntityId());
                    row.put("summary", log.getSummary() == null ? "" : log.getSummary());
                    row.put("performedBy", log.getPerformedBy() == null ? "" : log.getPerformedBy());
                    row.put("createdAt", log.getCreatedAt() == null ? "" : log.getCreatedAt().toString());

                    return row;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("number", result.getNumber());

        return response;
    }
}
