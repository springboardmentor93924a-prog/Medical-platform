package com.medistock.medistock.ai.forecasting;

import com.medistock.medistock.ai.entity.AIModelMetric;
import com.medistock.medistock.ai.repository.AIModelMetricRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
public class ForecastEvaluationService {

    private final MovingAverageService movingAverageService;
    private final ExponentialSmoothingService exponentialSmoothingService;
    private final AIModelMetricRepository modelMetricRepository;

    public record ModelEvaluationScore(
            String modelName,
            double mae,
            double rmse,
            double mape,
            double[] predictedHoldout,
            double[] actualHoldout
    ) {}

    public record ModelComparisonResult(
            String winningModel,
            String selectionCriterion,
            List<ModelEvaluationScore> evaluatedModels,
            int totalObservations,
            int holdoutSize
    ) {}

    public ForecastEvaluationService(
            MovingAverageService movingAverageService,
            ExponentialSmoothingService exponentialSmoothingService,
            AIModelMetricRepository modelMetricRepository) {
        this.movingAverageService = movingAverageService;
        this.exponentialSmoothingService = exponentialSmoothingService;
        this.modelMetricRepository = modelMetricRepository;
    }

    /**
     * Chronological backtesting evaluation:
     * Splits series into training set (1 .. N - holdoutDays) and validation set (last holdoutDays).
     * Fits models on training data, forecasts holdoutDays steps ahead, and computes MAE, RMSE, MAPE.
     */
    @Transactional
    public ModelComparisonResult evaluateAndSelectBestModel(double[] fullSeries, int holdoutDays, boolean persistMetrics) {
        if (fullSeries == null || fullSeries.length < 14) {
            throw new IllegalArgumentException("Full time series requires at least 14 days of data for chronological holdout validation. Given: "
                    + (fullSeries == null ? 0 : fullSeries.length));
        }

        int h = (holdoutDays > 0) ? Math.min(holdoutDays, fullSeries.length / 3) : 7;
        int trainLen = fullSeries.length - h;

        double[] trainSeries = Arrays.copyOfRange(fullSeries, 0, trainLen);
        double[] actualHoldout = Arrays.copyOfRange(fullSeries, trainLen, fullSeries.length);

        List<ModelEvaluationScore> scores = new ArrayList<>();

        // 1. Moving Average (7-day window on training set)
        int maWindow = Math.min(7, trainSeries.length);
        double maAdu = movingAverageService.calculate(trainSeries, maWindow);
        double[] maForecast = new double[h];
        Arrays.fill(maForecast, maAdu);
        scores.add(scoreModel("MOVING_AVERAGE_7D", maForecast, actualHoldout));

        // 2. Single Exponential Smoothing
        ExponentialSmoothingService.ForecastModelResult sesResult = exponentialSmoothingService.forecastSingle(trainSeries, h, null);
        scores.add(scoreModel("SINGLE_EXPONENTIAL_SMOOTHING", sesResult.forecast(), actualHoldout));

        // 3. Holt's Linear Trend (Double Exponential Smoothing)
        if (trainSeries.length >= 2) {
            ExponentialSmoothingService.ForecastModelResult holtResult = exponentialSmoothingService.forecastHolt(trainSeries, h, 0.3, 0.1);
            scores.add(scoreModel("HOLTS_LINEAR_TREND", holtResult.forecast(), actualHoldout));
        }

        // Select winning model by lowest RMSE
        scores.sort(Comparator.comparingDouble(ModelEvaluationScore::rmse));
        ModelEvaluationScore winner = scores.get(0);

        if (persistMetrics) {
            for (ModelEvaluationScore s : scores) {
                AIModelMetric entity = new AIModelMetric(
                        s.modelName(),
                        "1.0-pure-java",
                        BigDecimal.valueOf(s.mae()).setScale(4, RoundingMode.HALF_UP),
                        BigDecimal.valueOf(s.rmse()).setScale(4, RoundingMode.HALF_UP),
                        BigDecimal.valueOf(s.mape()).setScale(4, RoundingMode.HALF_UP)
                );
                modelMetricRepository.save(entity);
            }
        }

        return new ModelComparisonResult(
                winner.modelName(),
                "LOWEST_RMSE",
                scores,
                fullSeries.length,
                h
        );
    }

    public ModelEvaluationScore scoreModel(String modelName, double[] forecast, double[] actual) {
        int n = Math.min(forecast.length, actual.length);
        if (n == 0) {
            return new ModelEvaluationScore(modelName, 0.0, 0.0, 0.0, forecast, actual);
        }

        double sumAbsErr = 0.0;
        double sumSqErr = 0.0;
        double sumPctErr = 0.0;

        for (int i = 0; i < n; i++) {
            double actualVal = actual[i];
            double predVal = forecast[i];
            double err = actualVal - predVal;

            sumAbsErr += Math.abs(err);
            sumSqErr += err * err;

            // Safe MAPE: avoids division by zero if actual is zero
            double denominator = Math.max(1.0, actualVal);
            sumPctErr += (Math.abs(err) / denominator) * 100.0;
        }

        double mae = Math.round((sumAbsErr / n) * 10000.0) / 10000.0;
        double rmse = Math.round(Math.sqrt(sumSqErr / n) * 10000.0) / 10000.0;
        double mape = Math.round((sumPctErr / n) * 100.0) / 100.0;

        return new ModelEvaluationScore(modelName, mae, rmse, mape, forecast, actual);
    }
}
