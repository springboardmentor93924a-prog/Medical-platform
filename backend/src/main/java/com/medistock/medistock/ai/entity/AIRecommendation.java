package com.medistock.medistock.ai.entity;

import com.medistock.medistock.entity.Medicine;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_recommendations")
public class AIRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "medicine_id", nullable = false)
    private Integer medicineId;

    @Column(name = "recommendation_type", nullable = false, length = 50)
    private String recommendationType; // REORDER, EXPIRY_RISK, OVERSTOCK, SLOW_MOVING, DEAD_STOCK, ADEQUATE

    @Column(name = "current_stock", precision = 12, scale = 2)
    private BigDecimal currentStock;

    @Column(name = "recommended_quantity", precision = 12, scale = 2)
    private BigDecimal recommendedQuantity;

    @Column(name = "risk_level", length = 20)
    private String riskLevel; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "status", length = 30)
    private String status = "PENDING"; // PENDING, APPLIED, DISMISSED

    @Column(name = "generated_at", insertable = false, updatable = false)
    private LocalDateTime generatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", insertable = false, updatable = false)
    private Medicine medicine;

    public AIRecommendation() {
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

    public String getRecommendationType() {
        return recommendationType;
    }

    public void setRecommendationType(String recommendationType) {
        this.recommendationType = recommendationType;
    }

    public BigDecimal getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(BigDecimal currentStock) {
        this.currentStock = currentStock;
    }

    public BigDecimal getRecommendedQuantity() {
        return recommendedQuantity;
    }

    public void setRecommendedQuantity(BigDecimal recommendedQuantity) {
        this.recommendedQuantity = recommendedQuantity;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }
}
