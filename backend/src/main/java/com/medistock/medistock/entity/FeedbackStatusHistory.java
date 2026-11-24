package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback_status_history")
public class FeedbackStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Integer historyId;

    @Column(name = "ticket_id", nullable = false)
    private Integer ticketId;

    @Column(name = "old_status", length = 32)
    private String oldStatus;

    @Column(name = "new_status", nullable = false, length = 32)
    private String newStatus;

    @Column(name = "changed_by", nullable = false)
    private Integer changedBy;

    @Column(name = "change_reason", length = 500)
    private String changeReason;

    @Column(name = "changed_at", insertable = false, updatable = false)
    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "changed_by", insertable = false, updatable = false)
    private User changedByUser;

    public FeedbackStatusHistory() {
    }

    public Integer getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Integer historyId) {
        this.historyId = historyId;
    }

    public Integer getTicketId() {
        return ticketId;
    }

    public void setTicketId(Integer ticketId) {
        this.ticketId = ticketId;
    }

    public String getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(String oldStatus) {
        this.oldStatus = oldStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public Integer getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(Integer changedBy) {
        this.changedBy = changedBy;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }

    public User getChangedByUser() {
        return changedByUser;
    }

    public void setChangedByUser(User changedByUser) {
        this.changedByUser = changedByUser;
    }
}

