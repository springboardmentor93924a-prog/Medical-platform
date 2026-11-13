package com.medistock.backend.controller;

import com.medistock.backend.dto.MonitoringDtos.MonitoringResponse;
import com.medistock.backend.service.MonitoringService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/monitoring")
@PreAuthorize("hasRole('ADMIN')")
public class MonitoringController {
    private final MonitoringService service;

    public MonitoringController(MonitoringService service) { this.service = service; }

    @GetMapping
    public MonitoringResponse monitoring() { return service.build(); }
}
