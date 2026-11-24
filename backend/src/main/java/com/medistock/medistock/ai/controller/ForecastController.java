package com.medistock.medistock.ai.controller;

import com.medistock.medistock.ai.dto.ForecastTestDto;
import com.medistock.medistock.ai.forecasting.DemandForecastService;
import com.medistock.medistock.ai.forecasting.ForecastEvaluationService;
import com.medistock.medistock.ai.forecasting.ForecastEvaluationService.ModelComparisonResult;
import com.medistock.medistock.ai.reorder.ReorderCalculationService;
import com.medistock.medistock.ai.reorder.ReorderCalculationService.ReorderPlan;
import com.medistock.medistock.ai.risk.ExpiryRiskService;
import com.medistock.medistock.ai.risk.ExpiryRiskService.ExpiryRiskReport;
import com.medistock.medistock.ai.risk.OverstockDetectionService;
import com.medistock.medistock.ai.risk.OverstockDetectionService.OverstockAnalysis;
import com.medistock.medistock.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/ai/forecast")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
public class ForecastController {

    private final DemandForecastService demandForecastService;
    private final ForecastEvaluationService forecastEvaluationService;
    private final ReorderCalculationService reorderCalculationService;
    private final ExpiryRiskService expiryRiskService;
    private final OverstockDetectionService overstockDetectionService;

    public ForecastController(
            DemandForecastService demandForecastService,
            ForecastEvaluationService forecastEvaluationService,
            ReorderCalculationService reorderCalculationService,
            ExpiryRiskService expiryRiskService,
            OverstockDetectionService overstockDetectionService) {
        this.demandForecastService = demandForecastService;
        this.forecastEvaluationService = forecastEvaluationService;
        this.reorderCalculationService = reorderCalculationService;
        this.expiryRiskService = expiryRiskService;
        this.overstockDetectionService = overstockDetectionService;
    }

    /**
     * Phase 1 Read-Only Test Endpoint.
     * Computes verified Moving Average demand forecast based on actual stock_logs dispensing history.
     */
    @GetMapping("/test/{medicineId}")
    public ResponseEntity<ApiResponse<ForecastTestDto>> testForecast(
            @PathVariable Integer medicineId,
            @RequestParam(defaultValue = "7") Integer horizon,
            @RequestParam(defaultValue = "30") Integer lookback) {

        try {
            ForecastTestDto result = demandForecastService.testForecast(medicineId, horizon, lookback);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Phase 2: Chronological Backtesting & Model Comparison (MA vs SES vs Holt).
     */
    @GetMapping("/evaluate/{medicineId}")
    public ResponseEntity<ApiResponse<ModelComparisonResult>> evaluateModels(
            @PathVariable Integer medicineId,
            @RequestParam(defaultValue = "30") Integer lookback,
            @RequestParam(defaultValue = "7") Integer holdoutDays,
            @RequestParam(defaultValue = "false") Boolean persistMetrics) {

        try {
            double[] series = demandForecastService.getContinuousDailySeries(medicineId, lookback);
            ModelComparisonResult comparison = forecastEvaluationService.evaluateAndSelectBestModel(
                    series,
                    holdoutDays,
                    persistMetrics != null && persistMetrics
            );
            return ResponseEntity.ok(ApiResponse.ok(comparison));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to evaluate models: " + e.getMessage()));
        }
    }

    /**
     * Phase 2: Smart Reorder Engine (ROP, Safety Stock, Suggested Replenishment Qty).
     */
    @GetMapping("/reorder/{medicineId}")
    public ResponseEntity<ApiResponse<ReorderPlan>> getReorderPlan(@PathVariable Integer medicineId) {
        try {
            ReorderPlan plan = reorderCalculationService.calculateForMedicine(medicineId);
            return ResponseEntity.ok(ApiResponse.ok(plan));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to calculate reorder plan: " + e.getMessage()));
        }
    }

    /**
     * Phase 2: FEFO Batch Expiry Risk Simulation.
     */
    @GetMapping("/expiry-risk/{medicineId}")
    public ResponseEntity<ApiResponse<ExpiryRiskReport>> getExpiryRisk(@PathVariable Integer medicineId) {
        try {
            ExpiryRiskReport report = expiryRiskService.evaluateForMedicine(medicineId);
            return ResponseEntity.ok(ApiResponse.ok(report));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to evaluate expiry risk: " + e.getMessage()));
        }
    }

    /**
     * Phase 2: Overstock & Slow-Moving Stock Assessment.
     */
    @GetMapping("/overstock/{medicineId}")
    public ResponseEntity<ApiResponse<OverstockAnalysis>> getOverstockAnalysis(@PathVariable Integer medicineId) {
        try {
            OverstockAnalysis analysis = overstockDetectionService.analyzeForMedicine(medicineId);
            return ResponseEntity.ok(ApiResponse.ok(analysis));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to analyze overstock: " + e.getMessage()));
        }
    }
}
