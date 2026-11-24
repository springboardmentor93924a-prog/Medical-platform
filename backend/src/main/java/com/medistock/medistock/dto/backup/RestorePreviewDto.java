package com.medistock.medistock.dto.backup;

import java.time.LocalDateTime;
import java.util.List;

public class RestorePreviewDto {

    private Integer backupId;
    private String backupReference;
    private String backupName;
    private String description;
    private LocalDateTime backupDate;
    private Long fileSize;
    private String formattedFileSize;
    private String databaseVersion;
    private String checksum;
    private boolean checksumValid;
    private String encryptionStatus;
    private Integer tablesCount;
    private Long recordsCount;
    private List<String> previewTables;
    private String preRestoreSnapshotPlanned;
    private boolean safeToRestore;
    private String warningMessage;

    public RestorePreviewDto() {}

    public Integer getBackupId() {
        return backupId;
    }

    public void setBackupId(Integer backupId) {
        this.backupId = backupId;
    }

    public String getBackupReference() {
        return backupReference;
    }

    public void setBackupReference(String backupReference) {
        this.backupReference = backupReference;
    }

    public String getBackupName() {
        return backupName;
    }

    public void setBackupName(String backupName) {
        this.backupName = backupName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getBackupDate() {
        return backupDate;
    }

    public void setBackupDate(LocalDateTime backupDate) {
        this.backupDate = backupDate;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFormattedFileSize() {
        return formattedFileSize;
    }

    public void setFormattedFileSize(String formattedFileSize) {
        this.formattedFileSize = formattedFileSize;
    }

    public String getDatabaseVersion() {
        return databaseVersion;
    }

    public void setDatabaseVersion(String databaseVersion) {
        this.databaseVersion = databaseVersion;
    }

    public String getChecksum() {
        return checksum;
    }

    public void setChecksum(String checksum) {
        this.checksum = checksum;
    }

    public boolean isChecksumValid() {
        return checksumValid;
    }

    public void setChecksumValid(boolean checksumValid) {
        this.checksumValid = checksumValid;
    }

    public String getEncryptionStatus() {
        return encryptionStatus;
    }

    public void setEncryptionStatus(String encryptionStatus) {
        this.encryptionStatus = encryptionStatus;
    }

    public Integer getTablesCount() {
        return tablesCount;
    }

    public void setTablesCount(Integer tablesCount) {
        this.tablesCount = tablesCount;
    }

    public Long getRecordsCount() {
        return recordsCount;
    }

    public void setRecordsCount(Long recordsCount) {
        this.recordsCount = recordsCount;
    }

    public List<String> getPreviewTables() {
        return previewTables;
    }

    public void setPreviewTables(List<String> previewTables) {
        this.previewTables = previewTables;
    }

    public String getPreRestoreSnapshotPlanned() {
        return preRestoreSnapshotPlanned;
    }

    public void setPreRestoreSnapshotPlanned(String preRestoreSnapshotPlanned) {
        this.preRestoreSnapshotPlanned = preRestoreSnapshotPlanned;
    }

    public boolean isSafeToRestore() {
        return safeToRestore;
    }

    public void setSafeToRestore(boolean safeToRestore) {
        this.safeToRestore = safeToRestore;
    }

    public String getWarningMessage() {
        return warningMessage;
    }

    public void setWarningMessage(String warningMessage) {
        this.warningMessage = warningMessage;
    }
}

