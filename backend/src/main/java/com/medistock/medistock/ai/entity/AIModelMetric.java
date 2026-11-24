package com.medistock.medistock.ai.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_model_metrics")
public class AIModelMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Column(name = "mae", precision = 12, scale = 4)
    private BigDecimal mae;

    @Column(name = "rmse", precision = 12, scale = 4)
    private BigDecimal rmse;

    @Column(name = "mape", precision = 12, scale = 4)
    private BigDecimal mape;

    @Column(name = "evaluated_at", insertable = false, updatable = false)
    private LocalDateTime evaluatedAt;

    public AIModelMetric() {
    }

    public AIModelMetric(String modelName, String modelVersion, BigDecimal mae, BigDecimal rmse, BigDecimal mape) {
        this.modelName = modelName;
        this.modelVersion = modelVersion;
        this.mae = mae;
        this.rmse = rmse;
        this.mape = mape;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public BigDecimal getMae() {
        return mae;
    }

    public void setMae(BigDecimal mae) {
        this.mae = mae;
    }

    public BigDecimal getRmse() {
        return rmse;
    }

    public void setRmse(BigDecimal rmse) {
        this.rmse = rmse;
    }

    public BigDecimal getMape() {
        return mape;
    }

    public void setMape(BigDecimal mape) {
        this.mape = mape;
    }

    public LocalDateTime getEvaluatedAt() {
        return evaluatedAt;
    }
}
