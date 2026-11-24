package com.medistock.medistock.event;

import java.util.Map;

public class MediStockEmailEvent {

    private final String idempotencyKey;
    private final String eventType;
    private final Integer recipientUserId;
    private final String recipientEmail;
    private final String recipientName;
    private final String subject;
    private final String templateName;
    private final Map<String, Object> templateData;
    private final String priority;
    private final boolean mandatory;

    public MediStockEmailEvent(String idempotencyKey,
                               String eventType,
                               Integer recipientUserId,
                               String recipientEmail,
                               String recipientName,
                               String subject,
                               String templateName,
                               Map<String, Object> templateData,
                               String priority,
                               boolean mandatory) {
        this.idempotencyKey = idempotencyKey;
        this.eventType = eventType;
        this.recipientUserId = recipientUserId;
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.subject = subject;
        this.templateName = templateName;
        this.templateData = templateData;
        this.priority = priority != null ? priority : "NORMAL";
        this.mandatory = mandatory;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public String getEventType() {
        return eventType;
    }

    public Integer getRecipientUserId() {
        return recipientUserId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public String getSubject() {
        return subject;
    }

    public String getTemplateName() {
        return templateName;
    }

    public Map<String, Object> getTemplateData() {
        return templateData;
    }

    public String getPriority() {
        return priority;
    }

    public boolean isMandatory() {
        return mandatory;
    }
}

