package com.medistock.medistock.controller;

import com.medistock.medistock.dto.*;
import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.service.AiForecastingService;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-forecast")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
public class AiInventoryController {

    private final AiForecastingService forecastingService;
    private final CurrentUserService currentUserService;

    public AiInventoryController(AiForecastingService forecastingService, CurrentUserService currentUserService) {
        this.forecastingService = forecastingService;
        this.currentUserService = currentUserService;
    }

    /**
     * Get all AI inventory replenishment recommendations with optional filters.
     * Accessible by Admin and Pharmacist roles.
     */
    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<AiInventoryRecommendationDto>>> getRecommendations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String search) {

        List<AiInventoryRecommendationDto> list = forecastingService.getRecommendations(status, categoryId, search);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Get single medicine recommendation detail.
     */
    @GetMapping("/medicine/{medicineId}")
    public ResponseEntity<ApiResponse<AiInventoryRecommendationDto>> getMedicineRecommendation(
            @PathVariable Integer medicineId) {

        AiInventoryRecommendationDto rec = forecastingService.getRecommendationForMedicine(medicineId);
        if (rec == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok(rec));
    }

    /**
     * Get executive forecasting summary metrics (KPIs).
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AiForecastingSummaryDto>> getSummary() {
        AiForecastingSummaryDto summary = forecastingService.getSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    /**
     * Get Demand Forecast vs Actuals time-series chart with confidence intervals.
     */
    @GetMapping("/chart")
    public ResponseEntity<ApiResponse<DemandForecastChartDto>> getForecastChart(
            @RequestParam(defaultValue = "1") Integer medicineId,
            @RequestParam(defaultValue = "30") Integer days) {

        DemandForecastChartDto chart = forecastingService.getDemandForecastChart(medicineId, days);
        return ResponseEntity.ok(ApiResponse.ok(chart));
    }

    /**
     * Trigger on-demand recalculation of AI forecasting engine.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refreshForecast() {
        forecastingService.refreshForecast();
        Map<String, Object> resp = new HashMap<>();
        resp.put("refreshed", true);
        resp.put("message", "AI Demand Forecasting models successfully re-evaluated against real stock and consumption velocity.");
        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    /**
     * Pharmacist action: create purchase requisition from AI recommendation.
     * Note: Does NOT automatically approve order. Order is placed into PENDING_APPROVAL
     * for standard Hospital Admin review and approval.
     */
    @PostMapping("/requisition")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createRequisition(
            @RequestBody AiReorderRequisitionRequest request) {

        User currentUser = currentUserService.getCurrentUser().orElse(null);
        PurchaseOrder po = forecastingService.createRequisitionFromRecommendation(request, currentUser);

        Map<String, Object> result = new HashMap<>();
        result.put("purchaseOrderId", po.getPurchaseOrderId());
        result.put("orderNumber", "PO-2025-" + String.format("%04d", po.getPurchaseOrderId()));
        result.put("status", po.getStatus());
        result.put("totalAmount", po.getTotalAmount());
        result.put("message", "Requisition submitted successfully. Status is PENDING_APPROVAL awaiting Admin review.");

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}

