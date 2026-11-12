package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.entity.AuditLog;
import com.medistock.medistock_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/user/{email}")
    public ResponseEntity<List<AuditLog>> getByUser(@PathVariable String email) {
        return ResponseEntity.ok(auditLogRepository.findByUserEmailOrderByTimestampDesc(email));
    }
}