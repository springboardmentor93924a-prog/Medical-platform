package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_log")
public class StockLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stock_log_id")
    private Integer stockLogId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private MedicineBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "change_type", nullable = false, length = 20)
    private String changeType;

    @Column(name = "quantity_changed", nullable = false)
    private Integer quantityChanged;

    @Column(name = "date_time")
    private LocalDateTime dateTime;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    public Integer getStockLogId() {
        return stockLogId;
    }

    public MedicineBatch getBatch() {
        return batch;
    }

    public void setBatch(MedicineBatch batch) {
        this.batch = batch;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getChangeType() {
        return changeType;
    }

    public void setChangeType(String changeType) {
        this.changeType = changeType;
    }

    public Integer getQuantityChanged() {
        return quantityChanged;
    }

    public void setQuantityChanged(Integer quantityChanged) {
        this.quantityChanged = quantityChanged;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
