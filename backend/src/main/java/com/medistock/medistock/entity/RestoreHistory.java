package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restore_history")
public class RestoreHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "restore_id")
    private Integer restoreId;

    @Column(name = "restore_reference", nullable = false, unique = true, length = 64)
    private String restoreReference;

    @Column(name = "backup_reference", nullable = false, length = 64)
    private String backupReference;

    @Column(name = "backup_id")
    private Integer backupId;

    @Column(name = "pre_restore_backup_ref", length = 64)
    private String preRestoreBackupRef;

    @Column(name = "restore_status", nullable = false, length = 30)
    private String restoreStatus = "COMPLETED"; // IN_PROGRESS, STAGING_VERIFIED, COMPLETED, FAILED, ROLLED_BACK

    @Column(name = "recovery_point", length = 100)
    private String recoveryPoint;

    @Column(name = "target_database", nullable = false, length = 100)
    private String targetDatabase = "medistock";

    @Column(name = "tables_restored", nullable = false)
    private Integer tablesRestored = 0;

    @Column(name = "records_restored", nullable = false)
    private Long recordsRestored = 0L;

    @Column(name = "initiated_by", nullable = false, length = 150)
    private String initiatedBy = "System Administrator";

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "verification_report", columnDefinition = "TEXT")
    private String verificationReport;

    public RestoreHistory() {}

    public Integer getRestoreId() {
        return restoreId;
    }

    public void setRestoreId(Integer restoreId) {
        this.restoreId = restoreId;
    }

    public String getRestoreReference() {
        return restoreReference;
    }

    public void setRestoreReference(String restoreReference) {
        this.restoreReference = restoreReference;
    }

    public String getBackupReference() {
        return backupReference;
    }

    public void setBackupReference(String backupReference) {
        this.backupReference = backupReference;
    }

    public Integer getBackupId() {
        return backupId;
    }

    public void setBackupId(Integer backupId) {
        this.backupId = backupId;
    }

    public String getPreRestoreBackupRef() {
        return preRestoreBackupRef;
    }

    public void setPreRestoreBackupRef(String preRestoreBackupRef) {
        this.preRestoreBackupRef = preRestoreBackupRef;
    }

    public String getRestoreStatus() {
        return restoreStatus;
    }

    public void setRestoreStatus(String restoreStatus) {
        this.restoreStatus = restoreStatus;
    }

    public String getRecoveryPoint() {
        return recoveryPoint;
    }

    public void setRecoveryPoint(String recoveryPoint) {
        this.recoveryPoint = recoveryPoint;
    }

    public String getTargetDatabase() {
        return targetDatabase;
    }

    public void setTargetDatabase(String targetDatabase) {
        this.targetDatabase = targetDatabase;
    }

    public Integer getTablesRestored() {
        return tablesRestored;
    }

    public void setTablesRestored(Integer tablesRestored) {
        this.tablesRestored = tablesRestored;
    }

    public Long getRecordsRestored() {
        return recordsRestored;
    }

    public void setRecordsRestored(Long recordsRestored) {
        this.recordsRestored = recordsRestored;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getVerificationReport() {
        return verificationReport;
    }

    public void setVerificationReport(String verificationReport) {
        this.verificationReport = verificationReport;
    }
}

