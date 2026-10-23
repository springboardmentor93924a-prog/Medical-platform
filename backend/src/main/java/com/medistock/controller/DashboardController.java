package com.medistock.controller;

import com.medistock.dto.DashboardStats;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
public class DashboardController {

    private final DashboardStats dashboardStats;

    public DashboardController(DashboardStats dashboardStats) {
        this.dashboardStats = dashboardStats;
    }

    @GetMapping("/stats")
    public DashboardStats.Response stats() {
        return dashboardStats.compute();
    }
}
