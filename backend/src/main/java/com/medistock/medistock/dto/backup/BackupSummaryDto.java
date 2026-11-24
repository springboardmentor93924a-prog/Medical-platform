package com.medistock.medistock.dto.backup;

import java.time.LocalDateTime;

public class BackupSummaryDto {

    private long totalBackups;
    private long verifiedBackups;
    private long failedBackups;
    private long storageUsedBytes;
    private String formattedStorageUsed;
    private String latestBackupRef;
    private LocalDateTime latestBackupDate;
    private String latestBackupStatus;
    private String nextScheduledBackup;
    private boolean pitrAvailable;
    private String binlogStatus; // OFF, ON
    private String databaseEngine;

    public BackupSummaryDto() {}

    public long getTotalBackups() {
        return totalBackups;
    }

    public void setTotalBackups(long totalBackups) {
        this.totalBackups = totalBackups;
    }

    public long getVerifiedBackups() {
        return verifiedBackups;
    }

    public void setVerifiedBackups(long verifiedBackups) {
        this.verifiedBackups = verifiedBackups;
    }

    public long getFailedBackups() {
        return failedBackups;
    }

    public void setFailedBackups(long failedBackups) {
        this.failedBackups = failedBackups;
    }

    public long getStorageUsedBytes() {
        return storageUsedBytes;
    }

    public void setStorageUsedBytes(long storageUsedBytes) {
        this.storageUsedBytes = storageUsedBytes;
    }

    public String getFormattedStorageUsed() {
        return formattedStorageUsed;
    }

    public void setFormattedStorageUsed(String formattedStorageUsed) {
        this.formattedStorageUsed = formattedStorageUsed;
    }

    public String getLatestBackupRef() {
        return latestBackupRef;
    }

    public void setLatestBackupRef(String latestBackupRef) {
        this.latestBackupRef = latestBackupRef;
    }

    public LocalDateTime getLatestBackupDate() {
        return latestBackupDate;
    }

    public void setLatestBackupDate(LocalDateTime latestBackupDate) {
        this.latestBackupDate = latestBackupDate;
    }

    public String getLatestBackupStatus() {
        return latestBackupStatus;
    }

    public void setLatestBackupStatus(String latestBackupStatus) {
        this.latestBackupStatus = latestBackupStatus;
    }

    public String getNextScheduledBackup() {
        return nextScheduledBackup;
    }

    public void setNextScheduledBackup(String nextScheduledBackup) {
        this.nextScheduledBackup = nextScheduledBackup;
    }

    public boolean isPitrAvailable() {
        return pitrAvailable;
    }

    public void setPitrAvailable(boolean pitrAvailable) {
        this.pitrAvailable = pitrAvailable;
    }

    public String getBinlogStatus() {
        return binlogStatus;
    }

    public void setBinlogStatus(String binlogStatus) {
        this.binlogStatus = binlogStatus;
    }

    public String getDatabaseEngine() {
        return databaseEngine;
    }

    public void setDatabaseEngine(String databaseEngine) {
        this.databaseEngine = databaseEngine;
    }
}

