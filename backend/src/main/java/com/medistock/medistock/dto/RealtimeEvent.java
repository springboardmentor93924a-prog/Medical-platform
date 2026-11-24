package com.medistock.medistock.dto;

import java.time.Instant;

public class RealtimeEvent {
    private String eventType;
    private String targetRole; // ADMIN, PHARMACIST, STAFF, ALL
    private String entityType; // PURCHASE_ORDER, BATCH, TASK, NOTIFICATION, DISCREPANCY
    private Integer entityId;
    private String message;
    private Object data;
    private String timestamp;

    public RealtimeEvent() {
        this.timestamp = Instant.now().toString();
    }

    public RealtimeEvent(String eventType, String targetRole, String entityType, Integer entityId, String message, Object data) {
        this.eventType = eventType;
        this.targetRole = targetRole;
        this.entityType = entityType;
        this.entityId = entityId;
        this.message = message;
        this.data = data;
        this.timestamp = Instant.now().toString();
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Integer getEntityId() { return entityId; }
    public void setEntityId(Integer entityId) { this.entityId = entityId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}

