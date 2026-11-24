package com.medistock.medistock.ai;

import com.medistock.medistock.ai.forecasting.MovingAverageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class MovingAverageServiceTest {

    private MovingAverageService movingAverageService;

    @BeforeEach
    public void setUp() {
        movingAverageService = new MovingAverageService();
    }

    @Test
    @DisplayName("Should accurately calculate average daily usage from normal consumption series")
    public void testCalculateNormalDailySeries() {
        // Continuous 5-day series: [10, 12, 8, 15, 5] -> total = 50, avg = 10.0
        double[] usage = {10.0, 12.0, 8.0, 15.0, 5.0};
        double adu = movingAverageService.calculate(usage, 5);

        assertEquals(10.0, adu, 0.001, "5-day average daily usage should be exactly 10.0");
    }

    @Test
    @DisplayName("Should correctly handle zero-consumption padding in continuous calendar days")
    public void testMovingAverageWithZeroConsumptionDays() {
        // 7-day calendar series where 3 days had 0 dispensing: [14.0, 0.0, 21.0, 0.0, 7.0, 0.0, 28.0]
        // Total = 70.0 across 7 days -> ADU = 10.0
        double[] usage = {14.0, 0.0, 21.0, 0.0, 7.0, 0.0, 28.0};
        double adu = movingAverageService.calculate(usage, 7);

        assertEquals(10.0, adu, 0.001, "Zero-padded daily series must average accurately to 10.0");
    }

    @Test
    @DisplayName("Should generate 7-day and 30-day demand predictions using rolling lookback window")
    public void testForecastDemandSevenAndThirtyDays() {
        // 10 days of data, 7-day rolling window: last 7 days are [10, 10, 10, 10, 10, 10, 10]
        double[] usage = {5.0, 5.0, 5.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0};

        MovingAverageService.MovingAverageForecastResult res7 =
                movingAverageService.forecast(usage, 7, 7);

        assertEquals(10.0, res7.getAverageDailyUsage(), 0.001);
        assertEquals(70.0, res7.getPredictedDemand(), 0.001);
        assertEquals("MOVING_AVERAGE", res7.getModelName());
        assertEquals("SUCCESS", res7.getStatus());

        // 30-day projection
        MovingAverageService.MovingAverageForecastResult res30 =
                movingAverageService.forecast(usage, 7, 30);
        assertEquals(300.0, res30.getPredictedDemand(), 0.001);
    }

    @Test
    @DisplayName("Statistical bounds: do not invent confidence intervals when variance is zero")
    public void testForecastUncertaintyIntervalsZeroVariance() {
        // Completely constant consumption: standard deviation is 0.0
        double[] constantUsage = {10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0};
        MovingAverageService.MovingAverageForecastResult res =
                movingAverageService.forecast(constantUsage, 7, 7);

        // When standard deviation is 0, bounds should be null (not an invented range)
        assertNull(res.getLowerBound(), "Lower bound must be null when variance cannot produce meaningful uncertainty");
        assertNull(res.getUpperBound(), "Upper bound must be null when variance cannot produce meaningful uncertainty");
    }

    @Test
    @DisplayName("Statistical bounds: calculate empirical intervals when non-zero variance exists")
    public void testForecastUncertaintyIntervalsWithVariance() {
        double[] variableUsage = {5.0, 15.0, 8.0, 12.0, 6.0, 14.0, 10.0};
        MovingAverageService.MovingAverageForecastResult res =
                movingAverageService.forecast(variableUsage, 7, 7);

        assertNotNull(res.getLowerBound(), "Lower bound should be calculated from statistical standard error");
        assertNotNull(res.getUpperBound(), "Upper bound should be calculated from statistical standard error");
        assertTrue(res.getLowerBound().doubleValue() <= res.getPredictedDemand(), "Lower bound must be <= predicted demand");
        assertTrue(res.getUpperBound().doubleValue() >= res.getPredictedDemand(), "Upper bound must be >= predicted demand");
    }

    @Test
    @DisplayName("Should reject negative values in consumption array")
    public void testValidationNegativeValues() {
        double[] invalidUsage = {10.0, -5.0, 8.0, 12.0, 7.0};
        assertThrows(IllegalArgumentException.class, () -> movingAverageService.calculate(invalidUsage, 5),
                "Negative consumption must throw IllegalArgumentException");
    }

    @Test
    @DisplayName("Should reject NaN and Infinite values")
    public void testValidationNonFiniteValues() {
        double[] nanUsage = {10.0, Double.NaN, 8.0, 12.0, 7.0};
        assertThrows(IllegalArgumentException.class, () -> movingAverageService.calculate(nanUsage, 5),
                "NaN value must throw IllegalArgumentException");

        double[] infUsage = {10.0, Double.POSITIVE_INFINITY, 8.0, 12.0, 7.0};
        assertThrows(IllegalArgumentException.class, () -> movingAverageService.calculate(infUsage, 5),
                "Infinite value must throw IllegalArgumentException");
    }

    @Test
    @DisplayName("Should reject lookback period larger than dataset length")
    public void testValidationInsufficientObservations() {
        double[] shortUsage = {10.0, 12.0};
        assertThrows(IllegalArgumentException.class, () -> movingAverageService.calculate(shortUsage, 7),
                "Lookback period larger than available observations must throw IllegalArgumentException");
    }

    @Test
    @DisplayName("Should explicitly handle zero-consumption medicines safely without division by zero")
    public void testZeroConsumptionMedicine() {
        double[] zeroUsage = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0};
        MovingAverageService.MovingAverageForecastResult res =
                movingAverageService.forecast(zeroUsage, 7, 7);

        assertEquals(0.0, res.getAverageDailyUsage(), 0.001);
        assertEquals(0.0, res.getPredictedDemand(), 0.001);
        assertNull(res.getLowerBound());
        assertNull(res.getUpperBound());
        assertEquals("SUCCESS", res.getStatus());
    }
}
