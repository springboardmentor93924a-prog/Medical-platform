package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_preferences", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_pref_category", columnNames = {"user_id", "notification_category"})
})
public class EmailPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "preference_id")
    private Integer preferenceId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "notification_category", nullable = false, length = 60)
    private String notificationCategory;

    @Column(name = "is_enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public EmailPreference() {}

    public EmailPreference(Integer userId, String notificationCategory, Boolean enabled) {
        this.userId = userId;
        this.notificationCategory = notificationCategory;
        this.enabled = enabled;
    }

    public Integer getPreferenceId() {
        return preferenceId;
    }

    public void setPreferenceId(Integer preferenceId) {
        this.preferenceId = preferenceId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getNotificationCategory() {
        return notificationCategory;
    }

    public void setNotificationCategory(String notificationCategory) {
        this.notificationCategory = notificationCategory;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
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
}

