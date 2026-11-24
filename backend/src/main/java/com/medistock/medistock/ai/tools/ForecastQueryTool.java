package com.medistock.medistock.ai.tools;

import com.medistock.medistock.ai.dto.ForecastTestDto;
import com.medistock.medistock.ai.forecasting.DemandForecastService;
import com.medistock.medistock.config.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class ForecastQueryTool {

    private final DemandForecastService demandForecastService;

    public ForecastQueryTool(DemandForecastService demandForecastService) {
        this.demandForecastService = demandForecastService;
    }

    @Cacheable(value = CacheConfig.CACHE_DEMAND_FORECASTS, key = "(#medicineId != null ? #medicineId : 0) + '_' + (#horizonDays != null ? #horizonDays : 30)")
    public Map<String, Object> getDemandForecast(Integer medicineId, Integer horizonDays) {
        int h = (horizonDays != null && horizonDays > 0) ? horizonDays : 30;
        try {
            ForecastTestDto dto = demandForecastService.testForecast(medicineId, h, 30);
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("medicineId", dto.getMedicineId());
            map.put("medicineName", dto.getMedicineName());
            map.put("forecastHorizonDays", dto.getForecastDays());
            map.put("averageDailyUsage", dto.getAverageDailyUsage());
            map.put("projectedDemandUnits", dto.getPredictedDemand());
            map.put("usableBatchStock", dto.getUsableBatchStock());
            map.put("confidenceLowerBound", dto.getLowerBound());
            map.put("confidenceUpperBound", dto.getUpperBound());
            map.put("forecastingModel", dto.getModel());
            return map;
        } catch (Exception e) {
            return Map.of("error", "Unable to compute forecast for medicine ID " + medicineId + ": " + e.getMessage());
        }
    }
}

