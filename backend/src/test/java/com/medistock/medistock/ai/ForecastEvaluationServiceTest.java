package com.medistock.medistock.ai;

import com.medistock.medistock.ai.forecasting.ExponentialSmoothingService;
import com.medistock.medistock.ai.forecasting.ForecastEvaluationService;
import com.medistock.medistock.ai.forecasting.MovingAverageService;
import com.medistock.medistock.ai.repository.AIModelMetricRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

class ForecastEvaluationServiceTest {

    private ForecastEvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        MovingAverageService maService = new MovingAverageService();
        ExponentialSmoothingService esService = new ExponentialSmoothingService();
        AIModelMetricRepository metricRepo = Mockito.mock(AIModelMetricRepository.class);
        evaluationService = new ForecastEvaluationService(maService, esService, metricRepo);
    }

    @Test
    @DisplayName("Model Scoring: Correctly computes MAE, RMSE, and MAPE")
    void testScoreModel() {
        double[] actual = {10.0, 20.0, 30.0, 40.0};
        double[] pred = {12.0, 18.0, 33.0, 37.0};
        // Errors: +2, -2, +3, -3
        // Abs errors: 2, 2, 3, 3 -> sum 10 -> MAE = 2.5
        // Sq errors: 4, 4, 9, 9 -> sum 26 -> mean = 6.5 -> RMSE = sqrt(6.5) = 2.5495
        var score = evaluationService.scoreModel("TEST_MODEL", pred, actual);

        assertEquals("TEST_MODEL", score.modelName());
        assertEquals(2.5, score.mae(), 0.001);
        assertEquals(2.5495, score.rmse(), 0.001);
        assertTrue(score.mape() > 0.0);
    }

    @Test
    @DisplayName("Chronological Validation: Evaluates candidate models and picks winner with lowest RMSE")
    void testChronologicalValidation() {
        // Construct 30-day series
        double[] series = new double[30];
        for (int i = 0; i < 30; i++) {
            series[i] = 20.0 + (i % 5) * 2.0; // Oscillates mildly around 24
        }

        var result = evaluationService.evaluateAndSelectBestModel(series, 7, false);

        assertNotNull(result);
        assertNotNull(result.winningModel());
        assertEquals("LOWEST_RMSE", result.selectionCriterion());
        assertEquals(30, result.totalObservations());
        assertEquals(7, result.holdoutSize());
        assertEquals(3, result.evaluatedModels().size());

        // First model in sorted evaluatedModels must be the winning model
        assertEquals(result.winningModel(), result.evaluatedModels().get(0).modelName());
    }

    @Test
    @DisplayName("Validation: Throws if series length is under 14 days")
    void testMinimumLengthCheck() {
        double[] shortSeries = new double[10];
        assertThrows(IllegalArgumentException.class,
                () -> evaluationService.evaluateAndSelectBestModel(shortSeries, 3, false));
    }
}
