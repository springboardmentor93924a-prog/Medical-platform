package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "backup_records")
public class BackupRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "backup_id")
    private Integer backupId;

    @Column(name = "backup_reference", nullable = false, unique = true, length = 64)
    private String backupReference;

    @Column(name = "backup_name", nullable = false, length = 150)
    private String backupName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "backup_type", nullable = false, length = 30)
    private String backupType = "MANUAL"; // MANUAL, AUTOMATIC_SCHEDULED, PRE_RESTORE

    @Column(name = "scope", nullable = false, length = 50)
    private String scope = "FULL_DATABASE"; // FULL_DATABASE, SCHEMA_ONLY, DATA_ONLY

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_location", nullable = false, length = 500)
    private String fileLocation;

    @Column(name = "file_size", nullable = false)
    private Long fileSize = 0L;

    @Column(name = "checksum", nullable = false, length = 128)
    private String checksum; // SHA-256

    @Column(name = "encryption_status", nullable = false, length = 30)
    private String encryptionStatus = "AES_256";

    @Column(name = "backup_status", nullable = false, length = 30)
    private String backupStatus = "COMPLETED"; // COMPLETED, IN_PROGRESS, FAILED, VERIFIED, CORRUPTED

    @Column(name = "database_version", length = 100)
    private String databaseVersion;

    @Column(name = "tables_included", nullable = false)
    private Integer tablesIncluded = 0;

    @Column(name = "records_count", nullable = false)
    private Long recordsCount = 0L;

    @Column(name = "created_by", nullable = false, length = 150)
    private String createdBy = "System Administrator";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    public BackupRecord() {}

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

    public String getBackupType() {
        return backupType;
    }

    public void setBackupType(String backupType) {
        this.backupType = backupType;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileLocation() {
        return fileLocation;
    }

    public void setFileLocation(String fileLocation) {
        this.fileLocation = fileLocation;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getChecksum() {
        return checksum;
    }

    public void setChecksum(String checksum) {
        this.checksum = checksum;
    }

    public String getEncryptionStatus() {
        return encryptionStatus;
    }

    public void setEncryptionStatus(String encryptionStatus) {
        this.encryptionStatus = encryptionStatus;
    }

    public String getBackupStatus() {
        return backupStatus;
    }

    public void setBackupStatus(String backupStatus) {
        this.backupStatus = backupStatus;
    }

    public String getDatabaseVersion() {
        return databaseVersion;
    }

    public void setDatabaseVersion(String databaseVersion) {
        this.databaseVersion = databaseVersion;
    }

    public Integer getTablesIncluded() {
        return tablesIncluded;
    }

    public void setTablesIncluded(Integer tablesIncluded) {
        this.tablesIncluded = tablesIncluded;
    }

    public Long getRecordsCount() {
        return recordsCount;
    }

    public void setRecordsCount(Long recordsCount) {
        this.recordsCount = recordsCount;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getVerificationNotes() {
        return verificationNotes;
    }

    public void setVerificationNotes(String verificationNotes) {
        this.verificationNotes = verificationNotes;
    }
}

