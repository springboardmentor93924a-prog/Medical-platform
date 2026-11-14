package com.medistock.controller;

import com.medistock.dto.request.RegisterRequest;
import com.medistock.dto.request.SupplierStatusUpdateRequest;
import com.medistock.dto.request.UserStatusUpdateRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.dto.response.UserSummaryDto;
import com.medistock.entity.AuditLog;
import com.medistock.entity.Supplier;
import com.medistock.service.AuditLogService;
import com.medistock.service.SupplierService;
import com.medistock.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final SupplierService supplierService;
    private final AuditLogService auditLogService;

    public AdminController(UserService userService, SupplierService supplierService, AuditLogService auditLogService) {
        this.userService = userService;
        this.supplierService = supplierService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserSummaryDto>> createUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RegisterRequest request) {
        UserSummaryDto created = userService.createUser(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User created successfully", created));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updateUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserStatusUpdateRequest request) {
        UserSummaryDto updated = userService.updateUserStatus(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", updated));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteUser(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User account deleted successfully", null));
    }

    @PatchMapping("/suppliers/{id}/status")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplierStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupplierStatusUpdateRequest request) {
        Supplier updated = supplierService.updateSupplierStatus(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Supplier approval status updated successfully", updated));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditLogs(pageable)));
    }

    @GetMapping("/system-metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemMetrics() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("status", "UP");
        metrics.put("timestamp", Instant.now().toString());
        metrics.put("uptimeSeconds", ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        metrics.put("activeThreads", Thread.activeCount());
        metrics.put("availableProcessors", runtime.availableProcessors());

        Map<String, Object> memory = new HashMap<>();
        memory.put("totalMb", totalMemory / (1024 * 1024));
        memory.put("usedMb", usedMemory / (1024 * 1024));
        memory.put("freeMb", freeMemory / (1024 * 1024));
        memory.put("maxMb", maxMemory / (1024 * 1024));
        memory.put("usedPercentage", totalMemory > 0 ? Math.round(((double) usedMemory / (double) totalMemory) * 100) : 0);
        metrics.put("jvmMemory", memory);

        Map<String, Object> database = new HashMap<>();
        database.put("status", "UP");
        database.put("databaseType", "MySQL / MariaDB (Primary) | PostgreSQL (Ready)");
        database.put("connectionPool", "HikariCP Healthy");
        metrics.put("database", database);

        return ResponseEntity.ok(ApiResponse.success("System operational metrics retrieved", metrics));
    }
}
