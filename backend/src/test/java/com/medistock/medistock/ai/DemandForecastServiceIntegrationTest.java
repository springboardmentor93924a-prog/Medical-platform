package com.medistock.medistock.ai;

import com.medistock.medistock.ai.dto.ForecastTestDto;
import com.medistock.medistock.ai.entity.ForecastResult;
import com.medistock.medistock.ai.forecasting.DemandForecastService;
import com.medistock.medistock.ai.repository.ForecastResultRepository;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.repository.MedicineRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DemandForecastServiceIntegrationTest {

    @Autowired
    private DemandForecastService demandForecastService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private ForecastResultRepository forecastResultRepository;

    @Test
    @Transactional
    @DisplayName("Should run live database test forecast and persist result in forecast_results")
    public void testLiveForecastExecution() {
        List<Medicine> medicines = medicineRepository.findAll();
        assertFalse(medicines.isEmpty(), "Medicines table must contain seeded medicines");

        Medicine med = medicines.get(0);
        ForecastTestDto dto = demandForecastService.testForecast(med.getMedicineId(), 7, 30);

        assertNotNull(dto);
        assertEquals(med.getMedicineId(), dto.getMedicineId());
        assertEquals(med.getMedicineName(), dto.getMedicineName());
        assertEquals(7, dto.getForecastDays());
        assertNotNull(dto.getAverageDailyUsage());
        assertTrue(dto.getAverageDailyUsage() >= 0.0);
        assertNotNull(dto.getPredictedDemand());
        assertEquals("MOVING_AVERAGE", dto.getModel());
        assertEquals("SUCCESS", dto.getStatus());
        assertNotNull(dto.getUsableBatchStock());
        assertTrue(dto.getUsableBatchStock() >= 0);

        // Verify that the forecast was persisted in forecast_results table
        List<ForecastResult> savedResults = forecastResultRepository.findByMedicineIdOrderByForecastDateDesc(med.getMedicineId());
        assertFalse(savedResults.isEmpty(), "Forecast result must be recorded in forecast_results table");
        assertEquals(med.getMedicineId(), savedResults.get(0).getMedicineId());
        assertEquals(7, savedResults.get(0).getForecastHorizon());
    }

    @Test
    @DisplayName("Should throw NoSuchElementException when medicine ID does not exist")
    public void testNonExistentMedicine() {
        assertThrows(NoSuchElementException.class, () -> demandForecastService.testForecast(999999, 7, 30),
                "Non-existent medicine ID must throw NoSuchElementException");
    }
}
