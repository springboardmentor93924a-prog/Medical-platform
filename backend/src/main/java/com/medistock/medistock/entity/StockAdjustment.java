package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_adjustments")
public class StockAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "adjustment_id")
    private Integer adjustmentId;

    @Column(name = "batch_id", nullable = false)
    private Integer batchId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "adjustment_type", nullable = false, length = 30)
    private String adjustmentType; // QUARANTINE, DISPOSAL, DAMAGE, CORRECTION, RETURN

    @Column(name = "quantity_changed", nullable = false)
    private Integer quantityChanged;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "adjustment_date", insertable = false, updatable = false)
    private LocalDateTime adjustmentDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", insertable = false, updatable = false)
    private InventoryBatch batch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    public StockAdjustment() {
    }

    public Integer getAdjustmentId() {
        return adjustmentId;
    }

    public void setAdjustmentId(Integer adjustmentId) {
        this.adjustmentId = adjustmentId;
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

    public String getAdjustmentType() {
        return adjustmentType;
    }

    public void setAdjustmentType(String adjustmentType) {
        this.adjustmentType = adjustmentType;
    }

    public Integer getQuantityChanged() {
        return quantityChanged;
    }

    public void setQuantityChanged(Integer quantityChanged) {
        this.quantityChanged = quantityChanged;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getAdjustmentDate() {
        return adjustmentDate;
    }

    public void setAdjustmentDate(LocalDateTime adjustmentDate) {
        this.adjustmentDate = adjustmentDate;
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
}
