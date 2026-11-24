package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fefo_allocations")
public class FefoAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "allocation_id")
    private Integer allocationId;

    @Column(name = "medicine_id", nullable = false)
    private Integer medicineId;

    @Column(name = "batch_id", nullable = false)
    private Integer batchId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "requested_quantity", nullable = false)
    private Integer requestedQuantity;

    @Column(name = "allocated_quantity", nullable = false)
    private Integer allocatedQuantity;

    @Column(name = "is_fefo_compliant", nullable = false)
    private Boolean isFefoCompliant = true;

    @Column(name = "recommended_batch_id")
    private Integer recommendedBatchId;

    @Column(name = "batch_expiry_date", nullable = false)
    private LocalDate batchExpiryDate;

    @Column(name = "earliest_available_expiry")
    private LocalDate earliestAvailableExpiry;

    @Column(name = "override_reason")
    private String overrideReason;

    @Column(name = "reference_type", length = 50)
    private String referenceType = "DISPENSING";

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", insertable = false, updatable = false)
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", insertable = false, updatable = false)
    private InventoryBatch batch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recommended_batch_id", insertable = false, updatable = false)
    private InventoryBatch recommendedBatch;

    public FefoAllocation() {
    }

    public Integer getAllocationId() {
        return allocationId;
    }

    public void setAllocationId(Integer allocationId) {
        this.allocationId = allocationId;
    }

    public Integer getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Integer medicineId) {
        this.medicineId = medicineId;
    }

    public Integer getBatchId() {
        return batchId;
    }

    public void setBatchId(Integer batchId) {
        this.batchId = batchId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public Integer getAllocatedQuantity() {
        return allocatedQuantity;
    }

    public void setAllocatedQuantity(Integer allocatedQuantity) {
        this.allocatedQuantity = allocatedQuantity;
    }

    public Boolean getIsFefoCompliant() {
        return isFefoCompliant != null ? isFefoCompliant : true;
    }

    public void setIsFefoCompliant(Boolean isFefoCompliant) {
        this.isFefoCompliant = isFefoCompliant;
    }

    public Integer getRecommendedBatchId() {
        return recommendedBatchId;
    }

    public void setRecommendedBatchId(Integer recommendedBatchId) {
        this.recommendedBatchId = recommendedBatchId;
    }

    public LocalDate getBatchExpiryDate() {
        return batchExpiryDate;
    }

    public void setBatchExpiryDate(LocalDate batchExpiryDate) {
        this.batchExpiryDate = batchExpiryDate;
    }

    public LocalDate getEarliestAvailableExpiry() {
        return earliestAvailableExpiry;
    }

    public void setEarliestAvailableExpiry(LocalDate earliestAvailableExpiry) {
        this.earliestAvailableExpiry = earliestAvailableExpiry;
    }

    public String getOverrideReason() {
        return overrideReason;
    }

    public void setOverrideReason(String overrideReason) {
        this.overrideReason = overrideReason;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public InventoryBatch getBatch() {
        return batch;
    }

    public void setBatch(InventoryBatch batch) {
        this.batch = batch;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public InventoryBatch getRecommendedBatch() {
        return recommendedBatch;
    }

    public void setRecommendedBatch(InventoryBatch recommendedBatch) {
        this.recommendedBatch = recommendedBatch;
    }
}

