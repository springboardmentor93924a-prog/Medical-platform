package com.medistock.dto.backup;

import java.time.LocalDateTime;

public class NotificationSnapshot {
    private Long id;
    private String recipientEmail;
    private String targetRole;
    private String title;
    private String message;
    private String type;
    private String navigationUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public NotificationSnapshot() {}

    public NotificationSnapshot(Long id, String recipientEmail, String targetRole, String title,
                                String message, String type, String navigationUrl, Boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.recipientEmail = recipientEmail;
        this.targetRole = targetRole;
        this.title = title;
        this.message = message;
        this.type = type;
        this.navigationUrl = navigationUrl;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getNavigationUrl() { return navigationUrl; }
    public void setNavigationUrl(String navigationUrl) { this.navigationUrl = navigationUrl; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
