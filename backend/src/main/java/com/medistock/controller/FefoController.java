package com.medistock.controller;

import com.medistock.dto.request.FefoOverrideRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.FefoOverride;
import com.medistock.entity.Medicine;
import com.medistock.service.FefoService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/fefo")
public class FefoController {

    private final FefoService fefoService;

    public FefoController(FefoService fefoService) {
        this.fefoService = fefoService;
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Medicine>>> getRecommendations() {
        return ResponseEntity.ok(ApiResponse.success("FEFO prioritized batches retrieved", fefoService.getFefoRecommendations()));
    }

    @GetMapping("/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateFefo(
            @RequestParam Long medicineId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        return ResponseEntity.ok(ApiResponse.success(fefoService.validateFefoIssuing(medicineId, quantity)));
    }

    @PostMapping("/override")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<FefoOverride>> recordOverride(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FefoOverrideRequest request) {
        FefoOverride override = fefoService.recordOverride(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("FEFO override recorded in audit registry", override));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFefoStats() {
        return ResponseEntity.ok(ApiResponse.success(fefoService.getFefoComplianceStats()));
    }

    @GetMapping("/overrides")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Page<FefoOverride>>> getOverrideHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(fefoService.getOverrideHistory(pageable)));
    }
}
