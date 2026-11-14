package com.medistock.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fefo_overrides")
public class FefoOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requested_medicine_id", nullable = false)
    private Medicine requestedMedicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recommended_medicine_id", nullable = false)
    private Medicine recommendedMedicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "override_reason", nullable = false, length = 255)
    private String overrideReason;

    @Column(name = "requested_expiry_date", nullable = false)
    private LocalDate requestedExpiryDate;

    @Column(name = "recommended_expiry_date", nullable = false)
    private LocalDate recommendedExpiryDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public FefoOverride() {
    }

    public FefoOverride(Medicine requestedMedicine, Medicine recommendedMedicine, User user, Integer quantity, String overrideReason) {
        this.requestedMedicine = requestedMedicine;
        this.recommendedMedicine = recommendedMedicine;
        this.user = user;
        this.quantity = quantity;
        this.overrideReason = overrideReason;
        this.requestedExpiryDate = requestedMedicine.getExpiryDate();
        this.recommendedExpiryDate = recommendedMedicine.getExpiryDate();
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

    public Medicine getRequestedMedicine() {
        return requestedMedicine;
    }

    public void setRequestedMedicine(Medicine requestedMedicine) {
        this.requestedMedicine = requestedMedicine;
    }

    public Medicine getRecommendedMedicine() {
        return recommendedMedicine;
    }

    public void setRecommendedMedicine(Medicine recommendedMedicine) {
        this.recommendedMedicine = recommendedMedicine;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getOverrideReason() {
        return overrideReason;
    }

    public void setOverrideReason(String overrideReason) {
        this.overrideReason = overrideReason;
    }

    public LocalDate getRequestedExpiryDate() {
        return requestedExpiryDate;
    }

    public void setRequestedExpiryDate(LocalDate requestedExpiryDate) {
        this.requestedExpiryDate = requestedExpiryDate;
    }

    public LocalDate getRecommendedExpiryDate() {
        return recommendedExpiryDate;
    }

    public void setRecommendedExpiryDate(LocalDate recommendedExpiryDate) {
        this.recommendedExpiryDate = recommendedExpiryDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonProperty("userName")
    public String getUserName() {
        return user != null ? user.getFullName() : null;
    }

    @JsonProperty("userRole")
    public String getUserRole() {
        return user != null && user.getRole() != null ? user.getRole().name() : null;
    }

    @JsonProperty("requestedMedicineName")
    public String getRequestedMedicineName() {
        return requestedMedicine != null ? requestedMedicine.getName() : null;
    }

    @JsonProperty("requestedBatch")
    public String getRequestedBatch() {
        return requestedMedicine != null ? requestedMedicine.getBatchNumber() : null;
    }

    @JsonProperty("recommendedMedicineName")
    public String getRecommendedMedicineName() {
        return recommendedMedicine != null ? recommendedMedicine.getName() : null;
    }

    @JsonProperty("recommendedBatch")
    public String getRecommendedBatch() {
        return recommendedMedicine != null ? recommendedMedicine.getBatchNumber() : null;
    }
}
