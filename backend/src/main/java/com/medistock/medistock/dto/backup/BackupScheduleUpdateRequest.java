package com.medistock.medistock.dto.backup;

public class BackupScheduleUpdateRequest {

    private Boolean enabled;
    private String scheduledTime;
    private Integer retentionDays;

    public BackupScheduleUpdateRequest() {}

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public Integer getRetentionDays() {
        return retentionDays;
    }

    public void setRetentionDays(Integer retentionDays) {
        this.retentionDays = retentionDays;
    }
}

