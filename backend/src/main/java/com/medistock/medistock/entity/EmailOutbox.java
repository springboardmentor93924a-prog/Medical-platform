package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_outbox", uniqueConstraints = {
        @UniqueConstraint(name = "uq_outbox_idempotency", columnNames = {"idempotency_key"})
})
public class EmailOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "outbox_id")
    private Long outboxId;

    @Column(name = "idempotency_key", nullable = false, length = 120, unique = true)
    private String idempotencyKey;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "recipient_user_id")
    private Integer recipientUserId;

    @Column(name = "recipient_email", nullable = false, length = 150)
    private String recipientEmail;

    @Column(name = "recipient_name", length = 150)
    private String recipientName;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "template_name", nullable = false, length = 60)
    private String templateName;

    @Column(name = "template_data_json", columnDefinition = "LONGTEXT")
    private String templateDataJson;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, PROCESSING, SENT, FAILED, CANCELLED

    @Column(name = "priority", nullable = false, length = 20)
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, CRITICAL

    @Column(name = "attempts", nullable = false)
    private Integer attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 3;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public EmailOutbox() {}

    public Long getOutboxId() {
        return outboxId;
    }

    public void setOutboxId(Long outboxId) {
        this.outboxId = outboxId;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Integer getRecipientUserId() {
        return recipientUserId;
    }

    public void setRecipientUserId(Integer recipientUserId) {
        this.recipientUserId = recipientUserId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateDataJson() {
        return templateDataJson;
    }

    public void setTemplateDataJson(String templateDataJson) {
        this.templateDataJson = templateDataJson;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public LocalDateTime getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(LocalDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
}

