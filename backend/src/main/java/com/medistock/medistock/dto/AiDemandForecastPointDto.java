package com.medistock.medistock.dto;

import java.time.LocalDate;

public class AiDemandForecastPointDto {

    private LocalDate date;
    private String dateLabel;            // e.g. "15 Oct", "06 Nov"
    private Double actualSales;          // Dispensed quantity (null for future forecast)
    private Double forecastedDemand;     // Fitted past value or projected future demand
    private Double confidenceLower;      // Lower bound of confidence interval (fan/cone)
    private Double confidenceUpper;      // Upper bound of confidence interval
    private Boolean isHistorical;        // true = actual past data, false = future projection

    public AiDemandForecastPointDto() {
    }

    public AiDemandForecastPointDto(LocalDate date, String dateLabel, Double actualSales,
                                    Double forecastedDemand, Double confidenceLower,
                                    Double confidenceUpper, Boolean isHistorical) {
        this.date = date;
        this.dateLabel = dateLabel;
        this.actualSales = actualSales;
        this.forecastedDemand = forecastedDemand;
        this.confidenceLower = confidenceLower;
        this.confidenceUpper = confidenceUpper;
        this.isHistorical = isHistorical;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getDateLabel() {
        return dateLabel;
    }

    public void setDateLabel(String dateLabel) {
        this.dateLabel = dateLabel;
    }

    public Double getActualSales() {
        return actualSales;
    }

    public void setActualSales(Double actualSales) {
        this.actualSales = actualSales;
    }

    public Double getForecastedDemand() {
        return forecastedDemand;
    }

    public void setForecastedDemand(Double forecastedDemand) {
        this.forecastedDemand = forecastedDemand;
    }

    public Double getConfidenceLower() {
        return confidenceLower;
    }

    public void setConfidenceLower(Double confidenceLower) {
        this.confidenceLower = confidenceLower;
    }

    public Double getConfidenceUpper() {
        return confidenceUpper;
    }

    public void setConfidenceUpper(Double confidenceUpper) {
        this.confidenceUpper = confidenceUpper;
    }

    public Boolean getIsHistorical() {
        return isHistorical;
    }

    public void setIsHistorical(Boolean isHistorical) {
        this.isHistorical = isHistorical;
    }
}

