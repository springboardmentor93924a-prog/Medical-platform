package com.medistock.medistock.ai;

import com.medistock.medistock.ai.forecasting.ExponentialSmoothingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExponentialSmoothingServiceTest {

    private ExponentialSmoothingService service;

    @BeforeEach
    void setUp() {
        service = new ExponentialSmoothingService();
    }

    @Test
    @DisplayName("Single Exponential: Projects constant level equal to final smoothed state")
    void testSingleExponentialSmoothing() {
        double[] series = {10.0, 12.0, 14.0, 11.0, 13.0, 15.0};
        var result = service.forecastSingle(series, 7, 0.3);

        assertEquals("SINGLE_EXPONENTIAL_SMOOTHING", result.modelName());
        assertEquals(7, result.forecast().length);
        assertEquals(6, result.fittedValues().length);
        assertTrue(result.level() > 10.0 && result.level() < 16.0);

        // In SES, all future steps are flat equal to final level
        for (double val : result.forecast()) {
            assertEquals(result.level(), val, 0.0001);
        }
    }

    @Test
    @DisplayName("Holt Linear Trend: Accurately projects upward slope")
    void testHoltUpwardTrend() {
        // Linear sequence with slope +5 per period
        double[] series = {10.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0};
        var result = service.forecastHolt(series, 5, 0.5, 0.3);

        assertEquals("HOLTS_LINEAR_TREND", result.modelName());
        assertEquals(5, result.forecast().length);
        assertTrue(result.trend() > 0, "Trend slope must be positive");

        // Subsequent forecasts should be strictly monotonically increasing
        for (int i = 1; i < result.forecast().length; i++) {
            assertTrue(result.forecast()[i] > result.forecast()[i - 1],
                    "Forecast step " + i + " must exceed step " + (i - 1));
        }
    }

    @Test
    @DisplayName("Holt Linear Trend: Clamps downward trend at zero (no negative demand)")
    void testHoltDownwardTrendClampedAtZero() {
        double[] series = {50.0, 40.0, 30.0, 20.0, 10.0, 2.0};
        var result = service.forecastHolt(series, 10, 0.5, 0.3);

        for (double val : result.forecast()) {
            assertTrue(val >= 0.0, "Forecast value must never be negative in pharmacy operations: " + val);
        }
    }

    @Test
    @DisplayName("Validation: Rejects invalid inputs, negative numbers, and NaNs")
    void testValidation() {
        assertThrows(IllegalArgumentException.class, () -> service.forecastSingle(null, 7, 0.3));
        assertThrows(IllegalArgumentException.class, () -> service.forecastSingle(new double[]{}, 7, 0.3));
        assertThrows(IllegalArgumentException.class, () -> service.forecastSingle(new double[]{10.0}, 0, 0.3));
        assertThrows(IllegalArgumentException.class, () -> service.forecastSingle(new double[]{10.0, -5.0}, 7, 0.3));
        assertThrows(IllegalArgumentException.class, () -> service.forecastSingle(new double[]{10.0, Double.NaN}, 7, 0.3));
        assertThrows(IllegalArgumentException.class, () -> service.forecastHolt(new double[]{10.0}, 5, 0.3, 0.1)); // Holt needs >= 2
    }

    @Test
    @DisplayName("Grid search: Optimal alpha is within bounds [0.05, 0.95]")
    void testOptimizeAlpha() {
        double[] series = {10.0, 12.0, 11.0, 13.0, 14.0, 15.0, 13.0, 16.0};
        double bestAlpha = service.optimizeAlphaSingle(series);
        assertTrue(bestAlpha >= 0.05 && bestAlpha <= 0.95, "Optimized alpha must be in [0.05, 0.95]");
    }
}
