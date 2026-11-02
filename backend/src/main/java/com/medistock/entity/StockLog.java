package com.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_logs")
public class StockLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stock_log_id")
    private Long stockLogId;

    @Column(name = "inventory_id", nullable = false)
    private Long inventoryId;

    @Column(name = "movement_type", nullable = false, length = 20)
    private String movementType;

    @Column(name = "change_quantity", nullable = false)
    private Integer changeQuantity;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    // Default constructor
    public StockLog() {
    }

    // Parameterized constructor
    public StockLog(
            Long inventoryId,
            String movementType,
            Integer changeQuantity,
            Long userId,
            String notes) {

        this.inventoryId = inventoryId;
        this.movementType = movementType;
        this.changeQuantity = changeQuantity;
        this.userId = userId;
        this.notes = notes;
        this.changedAt = LocalDateTime.now();
    }

    // Automatically set timestamp before inserting
    @PrePersist
    protected void onCreate() {
        if (this.changedAt == null) {
            this.changedAt = LocalDateTime.now();
        }
    }

    // Getters and Setters

    public Long getStockLogId() {
        return stockLogId;
    }

    public void setStockLogId(Long stockLogId) {
        this.stockLogId = stockLogId;
    }

    public Long getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Long inventoryId) {
        this.inventoryId = inventoryId;
    }

    public String getMovementType() {
        return movementType;
    }

    public void setMovementType(String movementType) {
        this.movementType = movementType;
    }

    public Integer getChangeQuantity() {
        return changeQuantity;
    }

    public void setChangeQuantity(Integer changeQuantity) {
        this.changeQuantity = changeQuantity;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }
}