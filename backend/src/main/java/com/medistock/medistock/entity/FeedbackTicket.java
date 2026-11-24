package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback_tickets")
public class FeedbackTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Integer ticketId;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 32)
    private String ticketNumber;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false, length = 64)
    private String category;

    @Column(name = "priority", nullable = false, length = 20)
    private String priority = "MEDIUM";

    @Column(name = "status", nullable = false, length = 32)
    private String status = "SUBMITTED";

    @Column(name = "submitted_by", nullable = false)
    private Integer submittedBy;

    @Column(name = "source_role", nullable = false, length = 32)
    private String sourceRole = "STAFF";

    @Column(name = "assigned_to")
    private Integer assignedTo;

    @Column(name = "related_module", length = 100)
    private String relatedModule;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "reopen_reason", columnDefinition = "TEXT")
    private String reopenReason;

    @Column(name = "deadline_at")
    private LocalDateTime deadlineAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "submitted_by", insertable = false, updatable = false)
    private User submitter;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to", insertable = false, updatable = false)
    private User assignee;

    public FeedbackTicket() {
    }

    public Integer getTicketId() {
        return ticketId;
    }

    public void setTicketId(Integer ticketId) {
        this.ticketId = ticketId;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(Integer submittedBy) {
        this.submittedBy = submittedBy;
    }

    public String getSourceRole() {
        return sourceRole;
    }

    public void setSourceRole(String sourceRole) {
        this.sourceRole = sourceRole;
    }

    public Integer getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Integer assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getRelatedModule() {
        return relatedModule;
    }

    public void setRelatedModule(String relatedModule) {
        this.relatedModule = relatedModule;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }

    public LocalDateTime getDeadlineAt() {
        return deadlineAt;
    }

    public void setDeadlineAt(LocalDateTime deadlineAt) {
        this.deadlineAt = deadlineAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public User getSubmitter() {
        return submitter;
    }

    public void setSubmitter(User submitter) {
        this.submitter = submitter;
    }

    public User getAssignee() {
        return assignee;
    }

    public void setAssignee(User assignee) {
        this.assignee = assignee;
    }
}

