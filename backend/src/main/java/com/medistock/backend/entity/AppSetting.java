package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** One application setting stored as a key and a value. Settings that were never saved use their default. */
@Entity
@Table(name = "app_settings")
public class AppSetting {
    @Id @Column(name = "setting_key", length = 50)
    private String key;
    @Column(name = "setting_value", nullable = false, length = 255)
    private String value;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
    @Column(name = "updated_by", length = 30)
    private String updatedBy;

    protected AppSetting() {}
    public AppSetting(String key, String value, String updatedBy) {
        this.key = key; this.value = value; this.updatedBy = updatedBy;
    }

    public String getKey() { return key; }
    public String getValue() { return value; }
    public void setValue(String v) { this.value = v; this.updatedAt = Instant.now(); }
    public void setUpdatedBy(String v) { this.updatedBy = v; }
    public Instant getUpdatedAt() { return updatedAt; }
}
