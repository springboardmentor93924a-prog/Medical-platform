package com.medistock.service;

import com.medistock.dto.response.DashboardStatsResponse;

public interface DashboardService {
    DashboardStatsResponse getAdminDashboardStats();
    DashboardStatsResponse getPharmacistDashboardStats();
    DashboardStatsResponse getStaffDashboardStats();
    DashboardStatsResponse getSupplierDashboardStats(String supplierEmail);
}
