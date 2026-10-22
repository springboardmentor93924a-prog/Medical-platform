
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

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "change_quantity", nullable = false)
    private Integer changeQuantity;

    @Column(name = "movement_type", nullable = false, length = 30)
    private String movementType;

    @Column(name = "notes")
    private String notes;

    @Column(name = "changed_at", insertable = false, updatable = false)
    private LocalDateTime changedAt;

    public Long getStockLogId() { return stockLogId; }
    public Long getInventoryId() { return inventoryId; }
    public Long getUserId() { return userId; }
    public Integer getChangeQuantity() { return changeQuantity; }
    public String getMovementType() { return movementType; }
    public String getNotes() { return notes; }
    public LocalDateTime getChangedAt() { return changedAt; }

    public void setStockLogId(Long stockLogId) { this.stockLogId = stockLogId; }
    public void setInventoryId(Long inventoryId) { this.inventoryId = inventoryId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setChangeQuantity(Integer changeQuantity) { this.changeQuantity = changeQuantity; }
    public void setMovementType(String movementType) { this.movementType = movementType; }
    public void setNotes(String notes) { this.notes = notes; }
}
