package com.medistock.medistock.ai.forecasting;

import com.medistock.medistock.ai.dto.ForecastTestDto;
import com.medistock.medistock.ai.entity.ForecastResult;
import com.medistock.medistock.ai.repository.ForecastResultRepository;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.entity.StockLog;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.repository.StockLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DemandForecastService {

    private static final Logger log = LoggerFactory.getLogger(DemandForecastService.class);

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository batchRepository;
    private final StockLogRepository stockLogRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final MovingAverageService movingAverageService;

    public DemandForecastService(
            MedicineRepository medicineRepository,
            InventoryBatchRepository batchRepository,
            StockLogRepository stockLogRepository,
            ForecastResultRepository forecastResultRepository,
            MovingAverageService movingAverageService) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.stockLogRepository = stockLogRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.movingAverageService = movingAverageService;
    }

    /**
     * Executes Phase 1 test forecast calculation for a specific medicine.
     *
     * 1. Revalidates batch-level usable stock vs expired/quarantined stock.
     * 2. Extracts true clinical consumption from stock_logs (transaction_type = 'DISPENSED').
     * 3. Groups by calendar date and fills missing calendar days with 0.0.
     * 4. Evaluates Moving Average forecast and statistical error intervals.
     * 5. Persists forecast snapshot in forecast_results.
     */
    @Transactional
    public ForecastTestDto testForecast(Integer medicineId, Integer horizonDays, Integer lookbackDays) {
        int horizon = (horizonDays != null && horizonDays > 0) ? horizonDays : 7;
        int lookback = (lookbackDays != null && lookbackDays >= 5) ? lookbackDays : 30;

        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new NoSuchElementException("Medicine not found with ID: " + medicineId));

        LocalDate today = LocalDate.now();

        // 1. Batch-Level Inventory Assessment
        List<InventoryBatch> batches = batchRepository.findByMedicineId(medicineId);
        int totalBatchesCount = batches.size();
        int usableBatchStock = 0;

        for (InventoryBatch b : batches) {
            String status = b.getStatus() != null ? b.getStatus().toUpperCase() : "ACTIVE";
            boolean isUsableStatus = !status.equals("EXPIRED") && !status.equals("QUARANTINED") &&
                                     !status.equals("RECALLED") && !status.equals("DEPLETED");
            boolean notExpired = b.getExpiryDate() != null && !b.getExpiryDate().isBefore(today);

            if (isUsableStatus && notExpired && b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0) {
                usableBatchStock += b.getQuantityAvailable();
            }
        }

        // 2. Fetch DISPENSED logs for the medicine over the lookback window
        LocalDateTime sinceTime = today.minusDays(lookback).atStartOfDay();
        List<StockLog> logs = stockLogRepository.findDispensedLogsForMedicineSince(medicineId, sinceTime);

        // 3. Aggregate daily dispensed quantities by calendar date
        Map<LocalDate, Double> dailyQuantities = new HashMap<>();
        for (StockLog logItem : logs) {
            if (logItem.getCreatedAt() != null) {
                LocalDate date = logItem.getCreatedAt().toLocalDate();
                // Dispensed quantities in stock_logs are recorded as negative values (e.g. -15)
                double consumedUnits = Math.abs(logItem.getQuantityChanged() != null ? logItem.getQuantityChanged() : 0);

                // Handle return/reversal netting if notes or positive quantity indicate an adjustment
                if (logItem.getNotes() != null && (logItem.getNotes().toLowerCase().contains("reversal") ||
                                                   logItem.getNotes().toLowerCase().contains("cancelled"))) {
                    consumedUnits = -consumedUnits; // subtract reversal
                }

                dailyQuantities.put(date, dailyQuantities.getOrDefault(date, 0.0) + consumedUnits);
            }
        }

        // 4. Fill missing dates with 0.0 to construct a continuous daily time series
        double[] continuousDailySeries = new double[lookback];
        for (int i = 0; i < lookback; i++) {
            LocalDate day = today.minusDays(lookback - 1 - i);
            double qty = dailyQuantities.getOrDefault(day, 0.0);
            continuousDailySeries[i] = Math.max(0.0, qty);
        }

        // 5. Run Moving Average Forecasting
        MovingAverageService.MovingAverageForecastResult forecastResult =
                movingAverageService.forecast(continuousDailySeries, lookback, horizon);

        // 6. Record forecast snapshot in forecast_results table
        ForecastResult entity = new ForecastResult(
                medicine.getMedicineId(),
                today,
                horizon,
                BigDecimal.valueOf(forecastResult.getPredictedDemand()),
                forecastResult.getLowerBound(),
                forecastResult.getUpperBound(),
                forecastResult.getModelName(),
                forecastResult.getModelVersion(),
                LocalDateTime.now()
        );
        forecastResultRepository.save(entity);

        // 7. Assemble response DTO
        ForecastTestDto dto = new ForecastTestDto();
        dto.setMedicineId(medicine.getMedicineId());
        dto.setMedicineName(medicine.getMedicineName());
        dto.setAverageDailyUsage(forecastResult.getAverageDailyUsage());
        dto.setForecastDays(forecastResult.getForecastDays());
        dto.setPredictedDemand(forecastResult.getPredictedDemand());
        dto.setLowerBound(forecastResult.getLowerBound());
        dto.setUpperBound(forecastResult.getUpperBound());
        dto.setModel(forecastResult.getModelName());
        dto.setModelVersion(forecastResult.getModelVersion());
        dto.setStatus(forecastResult.getStatus());
        dto.setUsableBatchStock(usableBatchStock);
        dto.setTotalBatchesCount(totalBatchesCount);
        dto.setCalculationDate(today);

        if (forecastResult.getAverageDailyUsage() == 0.0) {
            dto.setMessage("Zero historical consumption recorded across the " + lookback + "-day lookback window. Predicted demand is 0.");
        } else {
            dto.setMessage(String.format("Calculated from %d calendar days of verified dispensing history (RMSE error: %.2f).",
                    lookback, forecastResult.getRmse()));
        }

        log.info("Completed Phase 1 test forecast for medicine {}: ADU={}, Predicted {}-day demand={}",
                medicine.getMedicineName(), dto.getAverageDailyUsage(), horizon, dto.getPredictedDemand());

        return dto;
    }

    /**
     * Builds continuous daily consumption series for any lookback period.
     */
    @Transactional(readOnly = true)
    public double[] getContinuousDailySeries(Integer medicineId, int lookbackDays) {
        int lookback = Math.max(7, lookbackDays);
        LocalDate today = LocalDate.now();
        LocalDateTime sinceTime = today.minusDays(lookback).atStartOfDay();
        List<StockLog> logs = stockLogRepository.findDispensedLogsForMedicineSince(medicineId, sinceTime);

        Map<LocalDate, Double> dailyQuantities = new HashMap<>();
        for (StockLog logItem : logs) {
            if (logItem.getCreatedAt() != null) {
                LocalDate date = logItem.getCreatedAt().toLocalDate();
                double consumedUnits = Math.abs(logItem.getQuantityChanged() != null ? logItem.getQuantityChanged() : 0);
                if (logItem.getNotes() != null && (logItem.getNotes().toLowerCase().contains("reversal") ||
                                                   logItem.getNotes().toLowerCase().contains("cancelled"))) {
                    consumedUnits = -consumedUnits;
                }
                dailyQuantities.put(date, dailyQuantities.getOrDefault(date, 0.0) + consumedUnits);
            }
        }

        double[] series = new double[lookback];
        for (int i = 0; i < lookback; i++) {
            LocalDate day = today.minusDays(lookback - 1 - i);
            series[i] = Math.max(0.0, dailyQuantities.getOrDefault(day, 0.0));
        }
        return series;
    }
}
