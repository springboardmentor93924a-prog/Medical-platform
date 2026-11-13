package com.medistock.backend.controller;

import com.medistock.backend.dto.AuditDtos.AuditResponse;
import com.medistock.backend.service.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {
    private final AuditService service;

    public AuditController(AuditService service) { this.service = service; }

    @GetMapping
    public AuditResponse audit() { return service.build(); }
}
