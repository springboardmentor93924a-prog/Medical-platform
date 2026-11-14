package com.medistock.controller;

import com.medistock.dto.response.ApiResponse;
import com.medistock.dto.response.DashboardStatsResponse;
import com.medistock.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAdminDashboardStats()));
    }

    @GetMapping("/pharmacist")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getPharmacistDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getPharmacistDashboardStats()));
    }

    @GetMapping("/staff")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStaffDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStaffDashboardStats()));
    }

    @GetMapping("/supplier")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getSupplierDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getSupplierDashboardStats(userDetails.getUsername())));
    }
}
