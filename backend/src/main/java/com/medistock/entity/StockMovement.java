package com.medistock.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medistock.enums.MovementType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private MovementType movementType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 255)
    private String reason;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public StockMovement() {
    }

    public StockMovement(Medicine medicine, MovementType movementType, Integer quantity, String reason, String referenceNumber, User performedBy) {
        this.medicine = medicine;
        this.movementType = movementType;
        this.quantity = quantity;
        this.reason = reason;
        this.referenceNumber = referenceNumber;
        this.performedBy = performedBy;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public void setMovementType(MovementType movementType) {
        this.movementType = movementType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public User getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(User performedBy) {
        this.performedBy = performedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonProperty("type")
    public MovementType getType() {
        return movementType;
    }

    @JsonProperty("medicineName")
    public String getMedicineName() {
        return medicine != null ? medicine.getName() : null;
    }

    @JsonProperty("medicineSku")
    public String getMedicineSku() {
        if (medicine == null) return null;
        return medicine.getSku() != null ? medicine.getSku() : medicine.getBatchNumber();
    }

    @JsonProperty("performedByName")
    public String getPerformedByName() {
        return performedBy != null ? performedBy.getFullName() : "System";
    }
}
