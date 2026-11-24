package com.medistock.medistock.ai.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ForecastTestDto {

    private Integer medicineId;
    private String medicineName;
    private Double averageDailyUsage;
    private Integer forecastDays;
    private Double predictedDemand;
    private BigDecimal lowerBound;
    private BigDecimal upperBound;
    private String model;
    private String modelVersion;
    private String status;
    private String message;
    private Integer usableBatchStock;
    private Integer totalBatchesCount;
    private LocalDate calculationDate;

    public ForecastTestDto() {
    }

    public Integer getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Integer medicineId) {
        this.medicineId = medicineId;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public Double getAverageDailyUsage() {
        return averageDailyUsage;
    }

    public void setAverageDailyUsage(Double averageDailyUsage) {
        this.averageDailyUsage = averageDailyUsage;
    }

    public Integer getForecastDays() {
        return forecastDays;
    }

    public void setForecastDays(Integer forecastDays) {
        this.forecastDays = forecastDays;
    }

    public Double getPredictedDemand() {
        return predictedDemand;
    }

    public void setPredictedDemand(Double predictedDemand) {
        this.predictedDemand = predictedDemand;
    }

    public BigDecimal getLowerBound() {
        return lowerBound;
    }

    public void setLowerBound(BigDecimal lowerBound) {
        this.lowerBound = lowerBound;
    }

    public BigDecimal getUpperBound() {
        return upperBound;
    }

    public void setUpperBound(BigDecimal upperBound) {
        this.upperBound = upperBound;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getUsableBatchStock() {
        return usableBatchStock;
    }

    public void setUsableBatchStock(Integer usableBatchStock) {
        this.usableBatchStock = usableBatchStock;
    }

    public Integer getTotalBatchesCount() {
        return totalBatchesCount;
    }

    public void setTotalBatchesCount(Integer totalBatchesCount) {
        this.totalBatchesCount = totalBatchesCount;
    }

    public LocalDate getCalculationDate() {
        return calculationDate;
    }

    public void setCalculationDate(LocalDate calculationDate) {
        this.calculationDate = calculationDate;
    }
}
