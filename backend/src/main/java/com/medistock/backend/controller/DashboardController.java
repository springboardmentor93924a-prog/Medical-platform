package com.medistock.backend.controller;

import com.medistock.backend.dto.DashboardDtos.DashboardResponse;
import com.medistock.backend.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;

    public DashboardController(DashboardService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF','SUPPLIER')")
    public DashboardResponse dashboard(Authentication auth) { return service.build(auth.getName()); }
}
