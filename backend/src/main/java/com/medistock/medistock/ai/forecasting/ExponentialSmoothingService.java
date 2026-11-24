package com.medistock.medistock.ai.forecasting;

import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * Pure Java Exponential Smoothing Forecasting Engine.
 * Supports:
 * 1. Single Exponential Smoothing (SES) for stationary demand without trend.
 * 2. Holt's Linear Trend (Double Exponential Smoothing) for demand with increasing/decreasing slopes.
 */
@Service
public class ExponentialSmoothingService {

    public record ForecastModelResult(
            String modelName,
            double[] forecast,
            double[] fittedValues,
            double level,
            double trend,
            double alpha,
            double beta,
            double sse
    ) {}

    /**
     * Single Exponential Smoothing (SES):
     * S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
     * F_{t+h} = S_t
     */
    public ForecastModelResult forecastSingle(double[] series, int forecastDays, Double userAlpha) {
        validateSeries(series, 1);
        if (forecastDays <= 0) {
            throw new IllegalArgumentException("Forecast horizon must be greater than zero.");
        }

        double alpha = (userAlpha != null) ? userAlpha : optimizeAlphaSingle(series);
        if (alpha <= 0.0 || alpha > 1.0) {
            throw new IllegalArgumentException("Alpha smoothing parameter must be in range (0.0, 1.0]. Given: " + alpha);
        }

        int n = series.length;
        double[] fitted = new double[n];
        double s = series[0];
        fitted[0] = s;
        double sse = 0.0;

        for (int t = 1; t < n; t++) {
            fitted[t] = s; // One-step-ahead forecast before observing Y_t
            double err = series[t] - fitted[t];
            sse += err * err;
            s = alpha * series[t] + (1.0 - alpha) * s;
        }

        double[] forecast = new double[forecastDays];
        Arrays.fill(forecast, Math.max(0.0, s));

        return new ForecastModelResult(
                "SINGLE_EXPONENTIAL_SMOOTHING",
                forecast,
                fitted,
                s,
                0.0,
                alpha,
                0.0,
                sse
        );
    }

    /**
     * Holt's Linear Trend Method (Double Exponential Smoothing):
     * Level:  S_t = alpha * Y_t + (1 - alpha) * (S_{t-1} + T_{t-1})
     * Trend:  T_t = beta * (S_t - S_{t-1}) + (1 - beta) * T_{t-1}
     * Forecast: F_{t+h} = S_t + h * T_t
     */
    public ForecastModelResult forecastHolt(double[] series, int forecastDays, Double userAlpha, Double userBeta) {
        validateSeries(series, 2);
        if (forecastDays <= 0) {
            throw new IllegalArgumentException("Forecast horizon must be greater than zero.");
        }

        double alpha = (userAlpha != null) ? userAlpha : 0.3;
        double beta = (userBeta != null) ? userBeta : 0.1;

        if (alpha <= 0.0 || alpha > 1.0) {
            throw new IllegalArgumentException("Alpha must be in range (0.0, 1.0]. Given: " + alpha);
        }
        if (beta <= 0.0 || beta > 1.0) {
            throw new IllegalArgumentException("Beta must be in range (0.0, 1.0]. Given: " + beta);
        }

        int n = series.length;
        double[] fitted = new double[n];

        // Initialization
        double s = series[0];
        double t = series[1] - series[0];
        fitted[0] = s;
        fitted[1] = s + t;
        double sse = 0.0;

        for (int i = 1; i < n; i++) {
            double prevS = s;
            double prevT = t;
            fitted[i] = prevS + prevT;
            double err = series[i] - fitted[i];
            sse += err * err;

            s = alpha * series[i] + (1.0 - alpha) * (prevS + prevT);
            t = beta * (s - prevS) + (1.0 - beta) * prevT;
        }

        double[] forecast = new double[forecastDays];
        for (int h = 1; h <= forecastDays; h++) {
            double projected = s + h * t;
            // Consumption cannot be negative in pharmacy operations
            forecast[h - 1] = Math.max(0.0, projected);
        }

        return new ForecastModelResult(
                "HOLTS_LINEAR_TREND",
                forecast,
                fitted,
                s,
                t,
                alpha,
                beta,
                sse
        );
    }

    /**
     * Grid search optimization for alpha in range [0.05, 0.95] by minimizing sum of squared errors (SSE).
     */
    public double optimizeAlphaSingle(double[] series) {
        if (series.length <= 2) {
            return 0.3; // Default baseline for very short series
        }

        double bestAlpha = 0.3;
        double minSse = Double.MAX_VALUE;

        for (double a = 0.05; a <= 0.95; a += 0.05) {
            double s = series[0];
            double sse = 0.0;
            for (int t = 1; t < series.length; t++) {
                double fitted = s;
                double err = series[t] - fitted;
                sse += err * err;
                s = a * series[t] + (1.0 - a) * s;
            }
            if (sse < minSse) {
                minSse = sse;
                bestAlpha = Math.round(a * 100.0) / 100.0;
            }
        }
        return bestAlpha;
    }

    private void validateSeries(double[] series, int minLength) {
        if (series == null) {
            throw new IllegalArgumentException("Time-series array cannot be null.");
        }
        if (series.length < minLength) {
            throw new IllegalArgumentException("Time-series requires at least " + minLength + " data point(s). Found: " + series.length);
        }
        for (int i = 0; i < series.length; i++) {
            double v = series[i];
            if (Double.isNaN(v) || Double.isInfinite(v)) {
                throw new IllegalArgumentException("Series contains NaN or infinite value at index " + i);
            }
            if (v < 0) {
                throw new IllegalArgumentException("Consumption value cannot be negative at index " + i + ": " + v);
            }
        }
    }
}
