package com.medistock.medistock.ai.forecasting;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Pure Java Moving Average Demand Forecasting Service.
 *
 * Implements rolling moving averages over configurable windows (7, 30, 90 days),
 * continuous zero-padded daily series validation, and empirical error evaluation.
 */
@Service
public class MovingAverageService {

    /**
     * Calculates the Average Daily Usage (ADU) over the specified window period.
     *
     * @param usage continuous daily consumption array (including zeros for non-dispensing days)
     * @param period number of days in the moving window (e.g. 7 or 30)
     * @return average daily consumption
     * @throws IllegalArgumentException if inputs are null, empty, non-finite, negative, or shorter than period
     */
    public double calculate(double[] usage, int period) {
        validateInputs(usage, period);

        double total = 0.0;
        int startIndex = usage.length - period;

        for (int i = startIndex; i < usage.length; i++) {
            total += usage[i];
        }

        return roundToTwoDecimals(total / period);
    }

    /**
     * Generates a demand forecast over a given horizon (e.g. 7, 30, or 90 days).
     *
     * @param usage continuous daily consumption array
     * @param windowPeriod rolling lookback window (e.g. 7 or 30 days)
     * @param forecastHorizonDays future horizon in days
     * @return structured forecast result containing ADU, predicted demand, and statistical bounds
     */
    public MovingAverageForecastResult forecast(double[] usage, int windowPeriod, int forecastHorizonDays) {
        validateInputs(usage, windowPeriod);
        if (forecastHorizonDays <= 0) {
            throw new IllegalArgumentException("Forecast horizon days must be strictly positive");
        }

        double adu = calculate(usage, windowPeriod);
        double predictedDemand = roundToTwoDecimals(adu * forecastHorizonDays);

        // Statistical Uncertainty Evaluation:
        // Do not invent arbitrary +/- ranges. Only calculate uncertainty if sufficient history
        // exists (at least 7 days) and historical sample variance is non-zero.
        BigDecimal lowerBound = null;
        BigDecimal upperBound = null;
        double rmse = 0.0;
        double mae = 0.0;

        if (windowPeriod >= 7) {
            double sumSquaredErrors = 0.0;
            double sumAbsoluteErrors = 0.0;
            int startIndex = usage.length - windowPeriod;

            for (int i = startIndex; i < usage.length; i++) {
                double residual = usage[i] - adu;
                sumSquaredErrors += residual * residual;
                sumAbsoluteErrors += Math.abs(residual);
            }

            mae = roundToTwoDecimals(sumAbsoluteErrors / windowPeriod);
            double variance = sumSquaredErrors / (windowPeriod - 1); // Sample variance
            double stdDev = Math.sqrt(variance);
            rmse = roundToTwoDecimals(stdDev);

            if (stdDev > 0.001) {
                // Statistical prediction interval: margin = 1.96 * sigma * sqrt(horizon / P)
                double margin = 1.96 * stdDev * Math.sqrt((double) forecastHorizonDays / windowPeriod);
                double lower = Math.max(0.0, predictedDemand - margin);
                double upper = predictedDemand + margin;

                lowerBound = BigDecimal.valueOf(roundToTwoDecimals(lower));
                upperBound = BigDecimal.valueOf(roundToTwoDecimals(upper));
            }
        }

        return new MovingAverageForecastResult(
                adu,
                forecastHorizonDays,
                predictedDemand,
                lowerBound,
                upperBound,
                mae,
                rmse,
                "MOVING_AVERAGE",
                "1.0.0",
                "SUCCESS"
        );
    }

    private void validateInputs(double[] usage, int period) {
        if (usage == null) {
            throw new IllegalArgumentException("Usage array cannot be null");
        }
        if (period <= 0) {
            throw new IllegalArgumentException("Period must be greater than zero");
        }
        if (usage.length < period) {
            throw new IllegalArgumentException(
                    "Insufficient observations: provided " + usage.length + " data points, but period requires " + period);
        }

        for (int i = 0; i < usage.length; i++) {
            double val = usage[i];
            if (!Double.isFinite(val)) {
                throw new IllegalArgumentException("Usage at index " + i + " is non-finite (NaN or Infinite)");
            }
            if (val < 0.0) {
                throw new IllegalArgumentException("Usage at index " + i + " cannot be negative: " + val);
            }
        }
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public static class MovingAverageForecastResult {
        private final double averageDailyUsage;
        private final int forecastDays;
        private final double predictedDemand;
        private final BigDecimal lowerBound;
        private final BigDecimal upperBound;
        private final double mae;
        private final double rmse;
        private final String modelName;
        private final String modelVersion;
        private final String status;

        public MovingAverageForecastResult(double averageDailyUsage, int forecastDays, double predictedDemand,
                                           BigDecimal lowerBound, BigDecimal upperBound, double mae, double rmse,
                                           String modelName, String modelVersion, String status) {
            this.averageDailyUsage = averageDailyUsage;
            this.forecastDays = forecastDays;
            this.predictedDemand = predictedDemand;
            this.lowerBound = lowerBound;
            this.upperBound = upperBound;
            this.mae = mae;
            this.rmse = rmse;
            this.modelName = modelName;
            this.modelVersion = modelVersion;
            this.status = status;
        }

        public double getAverageDailyUsage() {
            return averageDailyUsage;
        }

        public int getForecastDays() {
            return forecastDays;
        }

        public double getPredictedDemand() {
            return predictedDemand;
        }

        public BigDecimal getLowerBound() {
            return lowerBound;
        }

        public BigDecimal getUpperBound() {
            return upperBound;
        }

        public double getMae() {
            return mae;
        }

        public double getRmse() {
            return rmse;
        }

        public String getModelName() {
            return modelName;
        }

        public String getModelVersion() {
            return modelVersion;
        }

        public String getStatus() {
            return status;
        }
    }
}
