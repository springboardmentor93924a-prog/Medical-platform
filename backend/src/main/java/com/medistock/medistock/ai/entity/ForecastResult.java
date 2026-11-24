package com.medistock.medistock.ai.entity;

import com.medistock.medistock.entity.Medicine;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "forecast_results")
public class ForecastResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "medicine_id", nullable = false)
    private Integer medicineId;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "forecast_horizon", nullable = false)
    private Integer forecastHorizon; // 7, 30, 90

    @Column(name = "predicted_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal predictedQuantity;

    @Column(name = "lower_bound", precision = 12, scale = 2)
    private BigDecimal lowerBound;

    @Column(name = "upper_bound", precision = 12, scale = 2)
    private BigDecimal upperBound;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Column(name = "data_as_of", nullable = false)
    private LocalDateTime dataAsOf = LocalDateTime.now();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", insertable = false, updatable = false)
    private Medicine medicine;

    public ForecastResult() {
    }

    public ForecastResult(Integer medicineId, LocalDate forecastDate, Integer forecastHorizon,
                          BigDecimal predictedQuantity, BigDecimal lowerBound, BigDecimal upperBound,
                          String modelName, String modelVersion, LocalDateTime dataAsOf) {
        this.medicineId = medicineId;
        this.forecastDate = forecastDate;
        this.forecastHorizon = forecastHorizon;
        this.predictedQuantity = predictedQuantity;
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
        this.modelName = modelName;
        this.modelVersion = modelVersion;
        this.dataAsOf = dataAsOf != null ? dataAsOf : LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Integer medicineId) {
        this.medicineId = medicineId;
    }

    public LocalDate getForecastDate() {
        return forecastDate;
    }

    public void setForecastDate(LocalDate forecastDate) {
        this.forecastDate = forecastDate;
    }

    public Integer getForecastHorizon() {
        return forecastHorizon;
    }

    public void setForecastHorizon(Integer forecastHorizon) {
        this.forecastHorizon = forecastHorizon;
    }

    public BigDecimal getPredictedQuantity() {
        return predictedQuantity;
    }

    public void setPredictedQuantity(BigDecimal predictedQuantity) {
        this.predictedQuantity = predictedQuantity;
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

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public LocalDateTime getDataAsOf() {
        return dataAsOf;
    }

    public void setDataAsOf(LocalDateTime dataAsOf) {
        this.dataAsOf = dataAsOf;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }
}
