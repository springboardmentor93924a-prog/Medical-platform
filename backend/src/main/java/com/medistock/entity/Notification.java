package com.medistock.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", length = 20)
    private Role targetRole;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Column(name = "navigation_url", length = 255)
    private String navigationUrl;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Notification() {
    }

    public Notification(User recipient, Role targetRole, String title, String message, NotificationType type) {
        this.recipient = recipient;
        this.targetRole = targetRole;
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = false;
    }

    public Notification(User recipient, Role targetRole, String title, String message, NotificationType type, String navigationUrl) {
        this.recipient = recipient;
        this.targetRole = targetRole;
        this.title = title;
        this.message = message;
        this.type = type;
        this.navigationUrl = navigationUrl;
        this.isRead = false;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isRead == null) {
            this.isRead = false;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

    @JsonProperty("recipientId")
    public Long getRecipientId() {
        return recipient != null ? recipient.getId() : null;
    }

    @JsonProperty("recipientEmail")
    public String getRecipientEmail() {
        return recipient != null ? recipient.getEmail() : null;
    }

    public Role getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(Role targetRole) {
        this.targetRole = targetRole;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getNavigationUrl() {
        return navigationUrl;
    }

    public void setNavigationUrl(String navigationUrl) {
        this.navigationUrl = navigationUrl;
    }

    @JsonProperty("isRead")
    public Boolean getIsRead() {
        return isRead;
    }

    @JsonProperty("read")
    public Boolean getRead() {
        return isRead;
    }

    public void setIsRead(Boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
