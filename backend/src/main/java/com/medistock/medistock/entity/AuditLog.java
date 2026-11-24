package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_log_id")
    private Integer auditLogId;

    @Column(name = "event_id", unique = true, length = 64)
    private String eventId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "role_name", length = 30)
    private String roleName;

    @Column(name = "action", length = 100)
    private String action;

    @Column(name = "module_name", length = 100)
    private String moduleName;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private Integer entityId;

    @Column(name = "old_values", columnDefinition = "LONGTEXT")
    private String oldValues;

    @Column(name = "new_values", columnDefinition = "LONGTEXT")
    private String newValues;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "SUCCESS";

    @Column(name = "action_description", columnDefinition = "TEXT")
    private String actionDescription;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @Column(name = "previous_hash", length = 128)
    private String previousHash;

    @Column(name = "current_hash", length = 128)
    private String currentHash;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    public AuditLog() {
    }

    // Legacy constructor for backward compatibility
    public AuditLog(Integer userId, String actionType, String entityType, Integer entityId, String actionDescription, String ipAddress) {
        this.userId = userId;
        this.actionType = actionType;
        this.action = actionType;
        this.moduleName = entityType != null ? entityType.toUpperCase() : "GENERAL";
        this.entityType = entityType;
        this.entityId = entityId;
        this.actionDescription = actionDescription;
        this.reason = actionDescription;
        this.ipAddress = ipAddress;
        this.status = "SUCCESS";
    }

    public Integer getAuditLogId() {
        return auditLogId;
    }

    public void setAuditLogId(Integer auditLogId) {
        this.auditLogId = auditLogId;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
        if (this.actionType == null) {
            this.actionType = action;
        }
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
        if (this.action == null) {
            this.action = actionType;
        }
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    public String getOldValues() {
        return oldValues;
    }

    public void setOldValues(String oldValues) {
        this.oldValues = oldValues;
    }

    public String getNewValues() {
        return newValues;
    }

    public void setNewValues(String newValues) {
        this.newValues = newValues;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getActionDescription() {
        return actionDescription;
    }

    public void setActionDescription(String actionDescription) {
        this.actionDescription = actionDescription;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    public String getCurrentHash() {
        return currentHash;
    }

    public void setCurrentHash(String currentHash) {
        this.currentHash = currentHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
