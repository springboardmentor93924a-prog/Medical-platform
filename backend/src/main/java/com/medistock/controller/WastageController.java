package com.medistock.controller;

import com.medistock.dto.request.WastageRequest;
import com.medistock.dto.request.WastageReviewRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.WastageReport;
import com.medistock.enums.WastageStatus;
import com.medistock.service.WastageService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/v1/wastage")
public class WastageController {

    private final WastageService wastageService;

    public WastageController(WastageService wastageService) {
        this.wastageService = wastageService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<WastageReport>> reportWastage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WastageRequest request) {
        WastageReport report = wastageService.reportWastage(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Wastage report submitted for administrator review", report));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Page<WastageReport>>> getAllReports(
            @RequestParam(required = false) WastageStatus status,
            @RequestParam(required = false) Long medicineId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(wastageService.getAllReports(status, medicineId, pageable)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<Page<WastageReport>>> getMyReports(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(wastageService.getMyReports(userDetails.getUsername(), pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<WastageReport>> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(wastageService.getReportById(id)));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WastageReport>> reviewWastage(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WastageReviewRequest request) {
        WastageReport reviewed = wastageService.reviewWastage(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Wastage report " + reviewed.getStatus().name().toLowerCase() + " successfully", reviewed));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWastageStats() {
        return ResponseEntity.ok(ApiResponse.success(wastageService.getWastageStats()));
    }
}
