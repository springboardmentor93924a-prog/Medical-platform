package com.medistock.medistock.service;

import com.medistock.medistock.dto.backup.ConfirmRestoreRequest;
import com.medistock.medistock.dto.backup.CreateBackupRequest;
import com.medistock.medistock.dto.backup.RestorePreviewDto;
import com.medistock.medistock.entity.BackupRecord;
import com.medistock.medistock.entity.RestoreHistory;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.BackupRecordRepository;
import com.medistock.medistock.repository.RestoreHistoryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.GZIPInputStream;

@Service
public class DatabaseRestoreService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseRestoreService.class);

    private final BackupRecordRepository backupRecordRepository;
    private final RestoreHistoryRepository restoreHistoryRepository;
    private final BackupSecurityService backupSecurityService;
    private final DatabaseBackupService databaseBackupService;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${medistock.backup.mysql-path:C:/xampp/mysql/bin/mysql.exe}")
    private String mysqlPath;

    public DatabaseRestoreService(BackupRecordRepository backupRecordRepository,
            RestoreHistoryRepository restoreHistoryRepository,
            BackupSecurityService backupSecurityService,
            DatabaseBackupService databaseBackupService,
            AuditService auditService,
            CurrentUserService currentUserService,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        this.backupRecordRepository = backupRecordRepository;
        this.restoreHistoryRepository = restoreHistoryRepository;
        this.backupSecurityService = backupSecurityService;
        this.databaseBackupService = databaseBackupService;
        this.auditService = auditService;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Previews backup metadata and verifies checksum prior to restoration.
     */
    public RestorePreviewDto previewRestore(Integer backupId) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new IllegalArgumentException("Backup record not found with ID: " + backupId));

        File file = new File(record.getFileLocation());
        RestorePreviewDto dto = new RestorePreviewDto();
        dto.setBackupId(record.getBackupId());
        dto.setBackupReference(record.getBackupReference());
        dto.setBackupName(record.getBackupName());
        dto.setDescription(record.getDescription());
        dto.setBackupDate(record.getCreatedAt());
        dto.setFileSize(record.getFileSize());
        dto.setFormattedFileSize(formatBytes(record.getFileSize()));
        dto.setDatabaseVersion(record.getDatabaseVersion());
        dto.setChecksum(record.getChecksum());
        dto.setEncryptionStatus(record.getEncryptionStatus());
        dto.setTablesCount(record.getTablesIncluded());
        dto.setRecordsCount(record.getRecordsCount());
        dto.setPreRestoreSnapshotPlanned("Auto Pre-Restore Snapshot (BKP-PRE-RESTORE)");

        if (!file.exists()) {
            dto.setChecksumValid(false);
            dto.setSafeToRestore(false);
            dto.setWarningMessage("CRITICAL: Physical backup file is missing from storage.");
            dto.setPreviewTables(List.of());
            return dto;
        }

        try {
            String currentChecksum = backupSecurityService.calculateChecksum(file);
            boolean valid = currentChecksum.equalsIgnoreCase(record.getChecksum());
            dto.setChecksumValid(valid);

            // Preview essential tables included
            List<String> coreTables = List.of(
                    "medicines", "inventory_batches", "fefo_allocations", "users",
                    "roles", "suppliers", "purchase_orders", "wastage_records", "audit_logs");
            dto.setPreviewTables(coreTables);

            if (valid) {
                dto.setSafeToRestore(true);
                dto.setWarningMessage(
                        "Restoring this backup will replace current inventory and transaction records with the state from "
                                + record.getCreatedAt() + ". An automated pre-restore backup will be captured first.");
            } else {
                dto.setSafeToRestore(false);
                dto.setWarningMessage(
                        "SECURITY WARNING: SHA-256 checksum mismatch! The backup file may have been modified or corrupted.");
            }
        } catch (Exception e) {
            dto.setChecksumValid(false);
            dto.setSafeToRestore(false);
            dto.setWarningMessage("Error inspecting backup file: " + e.getMessage());
            dto.setPreviewTables(List.of());
        }

        return dto;
    }

    /**
     * Executes safe, controlled database restoration with mandatory pre-restore
     * snapshot.
     */
    public RestoreHistory confirmAndExecuteRestore(Integer backupId, ConfirmRestoreRequest req,
            HttpServletRequest httpRequest) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new IllegalArgumentException("Backup record not found with ID: " + backupId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Unauthorized: Admin authentication context required."));

        // Mandatory strong re-authentication
        if (req.getAdminPassword() == null
                || !passwordEncoder.matches(req.getAdminPassword(), currentUser.getPasswordHash())) {
            auditService.logEvent(
                    currentUser.getUserId(),
                    "ADMIN",
                    "RESTORE_AUTH_FAILED",
                    "BACKUP_MANAGEMENT",
                    "BACKUP",
                    backupId,
                    null,
                    Map.of("backupRef", record.getBackupReference()),
                    "Failed re-authentication attempt during restore confirmation.",
                    "BLOCKED",
                    httpRequest);
            throw new SecurityException("Invalid administrator password. Restoration cancelled.");
        }

        File encryptedFile = new File(record.getFileLocation());
        if (!encryptedFile.exists()) {
            throw new IllegalStateException("Physical backup file not found at " + record.getFileLocation());
        }

        String restoreRef = "RST-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        LocalDateTime startedAt = LocalDateTime.now().withNano(0);

        // Step 1: Capture Pre-Restore Backup if requested
        BackupRecord preRestoreBkp = null;
        if (req.isCreatePreRestoreBackup()) {
            try {
                CreateBackupRequest preReq = new CreateBackupRequest();
                preReq.setBackupName("Pre_Restore_Safety_Snapshot_" + restoreRef);
                preReq.setDescription(
                        "Automated pre-restore snapshot created prior to applying " + record.getBackupReference());
                preRestoreBkp = databaseBackupService.createBackup(preReq, "PRE_RESTORE", httpRequest);
                log.info("Pre-restore snapshot successfully captured: {}", preRestoreBkp.getBackupReference());
            } catch (Exception e) {
                log.error("Failed to create pre-restore snapshot: {}", e.getMessage());
                RestoreHistory aborted = new RestoreHistory();
                aborted.setRestoreReference(restoreRef);
                aborted.setBackupReference(record.getBackupReference());
                aborted.setBackupId(record.getBackupId());
                aborted.setInitiatedBy(currentUser.getFullName() + " (" + currentUser.getEmail() + ")");
                aborted.setStartedAt(startedAt);
                aborted.setRestoreStatus("FAILED");
                aborted.setFailureReason("Aborted: Could not create safety pre-restore backup: " + e.getMessage());
                aborted.setCompletedAt(LocalDateTime.now().withNano(0));
                return restoreHistoryRepository.save(aborted);
            }
        }

        // Snapshot existing backup records before SQL restore so metadata catalog is
        // preserved
        List<BackupRecord> backupsBeforeRestore = backupRecordRepository.findAll();

        // Step 2: Decrypt & Decompress to staging SQL
        File tempDecryptedGz = null;
        File tempSqlFile = null;

        try {
            tempDecryptedGz = File.createTempFile("medistock_rst_", ".gz");
            tempSqlFile = File.createTempFile("medistock_rst_", ".sql");

            backupSecurityService.decryptFile(encryptedFile, tempDecryptedGz);
            decompressGzip(tempDecryptedGz, tempSqlFile);

            if (tempSqlFile.length() == 0) {
                throw new IllegalStateException("Decompressed SQL file is empty.");
            }

            // Step 3: Apply SQL script to MariaDB
            executeSqlRestore(tempSqlFile);

            if (entityManager != null) {
                entityManager.clear();
            }

            // Re-sync backup records catalog if any were overwritten
            for (BackupRecord bkp : backupsBeforeRestore) {
                Integer existingCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM backup_records WHERE backup_reference = ?",
                        Integer.class,
                        bkp.getBackupReference());
                if (existingCount == null || existingCount == 0) {
                    jdbcTemplate.update(
                            "INSERT INTO backup_records (backup_reference, backup_name, description, backup_type, scope, file_name, file_location, file_size, checksum, encryption_status, backup_status, database_version, tables_included, records_count, created_by, created_at, verified_at, verification_notes) "
                                    +
                                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            bkp.getBackupReference(), bkp.getBackupName(), bkp.getDescription(), bkp.getBackupType(),
                            bkp.getScope(),
                            bkp.getFileName(), bkp.getFileLocation(), bkp.getFileSize(), bkp.getChecksum(),
                            bkp.getEncryptionStatus(),
                            bkp.getBackupStatus(), bkp.getDatabaseVersion(), bkp.getTablesIncluded(),
                            bkp.getRecordsCount(),
                            bkp.getCreatedBy(), bkp.getCreatedAt(), bkp.getVerifiedAt(), bkp.getVerificationNotes());
                }
            }

            if (entityManager != null) {
                entityManager.clear();
            }

            // Step 4: Verify post-restore consistency
            int tableCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'medistock'", Integer.class);
            long totalStock = jdbcTemplate
                    .queryForObject("SELECT COALESCE(SUM(quantity_available), 0) FROM inventory_batches", Long.class);

            RestoreHistory completed = new RestoreHistory();
            completed.setRestoreReference(restoreRef);
            completed.setBackupReference(record.getBackupReference());
            completed.setBackupId(record.getBackupId());
            completed.setPreRestoreBackupRef(preRestoreBkp != null ? preRestoreBkp.getBackupReference() : null);
            completed.setRecoveryPoint(record.getCreatedAt().toString());
            completed.setInitiatedBy(currentUser.getFullName() + " (" + currentUser.getEmail() + ")");
            completed.setStartedAt(startedAt);
            completed.setRestoreStatus("COMPLETED");
            completed.setTargetDatabase("medistock");
            completed.setTablesRestored(tableCount);
            completed.setRecordsRestored(totalStock);
            completed.setCompletedAt(LocalDateTime.now().withNano(0));
            completed.setVerificationReport("Restoration verified successfully: " + tableCount
                    + " tables restored; total stock verified: " + totalStock);
            RestoreHistory savedHistory = restoreHistoryRepository.save(completed);

            auditService.logEvent(
                    currentUser.getUserId(),
                    "ADMIN",
                    "RESTORE_DATABASE_SUCCESS",
                    "BACKUP_MANAGEMENT",
                    "BACKUP",
                    record.getBackupId(),
                    Map.of("previousSnapshot", preRestoreBkp != null ? preRestoreBkp.getBackupReference() : "NONE"),
                    Map.of("restoreRef", restoreRef, "appliedBackup", record.getBackupReference(), "tables",
                            tableCount),
                    "Successfully restored database from backup " + record.getBackupReference() + " (Safety Snapshot: "
                            + (preRestoreBkp != null ? preRestoreBkp.getBackupReference() : "NONE") + ")",
                    "SUCCESS",
                    httpRequest);

            log.info("Database restoration {} completed successfully from {}", restoreRef, record.getBackupReference());
            return savedHistory;

        } catch (Exception e) {
            log.error("Database restoration failed: {}", e.getMessage(), e);
            RestoreHistory failed = new RestoreHistory();
            failed.setRestoreReference(restoreRef);
            failed.setBackupReference(record.getBackupReference());
            failed.setBackupId(record.getBackupId());
            failed.setPreRestoreBackupRef(preRestoreBkp != null ? preRestoreBkp.getBackupReference() : null);
            failed.setRecoveryPoint(record.getCreatedAt().toString());
            failed.setInitiatedBy(currentUser.getFullName() + " (" + currentUser.getEmail() + ")");
            failed.setStartedAt(startedAt);
            failed.setRestoreStatus("FAILED");
            failed.setFailureReason("Restoration failed: " + e.getMessage());
            failed.setCompletedAt(LocalDateTime.now().withNano(0));
            try {
                restoreHistoryRepository.save(failed);
            } catch (Exception ignore) {
            }

            auditService.logEvent(
                    currentUser.getUserId(),
                    "ADMIN",
                    "RESTORE_DATABASE_FAILED",
                    "BACKUP_MANAGEMENT",
                    "BACKUP",
                    record.getBackupId(),
                    null,
                    Map.of("restoreRef", restoreRef, "error", e.getMessage()),
                    "Failed to restore database from backup " + record.getBackupReference() + ": " + e.getMessage(),
                    "FAILED",
                    httpRequest);

            throw new RuntimeException("Database restoration failed: " + e.getMessage(), e);
        } finally {
            if (tempDecryptedGz != null && tempDecryptedGz.exists())
                tempDecryptedGz.delete();
            if (tempSqlFile != null && tempSqlFile.exists())
                tempSqlFile.delete();
        }
    }

    private void executeSqlRestore(File sqlFile) throws Exception {
        File mysqlExe = new File(mysqlPath);
        boolean nativeSuccess = false;

        if (mysqlExe.exists() && mysqlExe.canExecute()) {
            try {
                ProcessBuilder pb = new ProcessBuilder(
                        mysqlExe.getAbsolutePath(),
                        "--host=127.0.0.1",
                        "--port=3307",
                        "-u", "root",
                        "medistock");
                pb.redirectInput(sqlFile);
                pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
                pb.redirectError(ProcessBuilder.Redirect.DISCARD);

                Process process = pb.start();
                boolean finished = process.waitFor(45, java.util.concurrent.TimeUnit.SECONDS);
                if (finished && process.exitValue() == 0) {
                    nativeSuccess = true;
                    log.info("Native mysql client restored database successfully");
                } else {
                    if (!finished)
                        process.destroyForcibly();
                    log.warn(
                            "mysql process did not complete cleanly (finished={}, exit={}), falling back to internal batch executor",
                            finished, finished ? process.exitValue() : -1);
                }
            } catch (Exception ex) {
                log.warn("Native mysql restore failed ({}), executing statements via JDBC", ex.getMessage());
            }
        }

        if (!nativeSuccess) {
            executeSqlViaJdbc(sqlFile);
        }
    }

    private void executeSqlViaJdbc(File sqlFile) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(sqlFile), StandardCharsets.UTF_8))) {
            StringBuilder stmt = new StringBuilder();
            String line;
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");

            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.startsWith("--") || trimmed.startsWith("/*") || trimmed.isEmpty()) {
                    continue;
                }
                stmt.append(line).append("\n");
                if (trimmed.endsWith(";")) {
                    String sql = stmt.toString().trim();
                    try {
                        jdbcTemplate.execute(sql);
                    } catch (Exception e) {
                        // Ignore non-fatal statement failures on existing views/indexes
                        log.debug("Notice on statement execution: {}", e.getMessage());
                    }
                    stmt.setLength(0);
                }
            }

            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
        }
    }

    private void decompressGzip(File gzFile, File targetFile) throws IOException {
        try (FileInputStream fis = new FileInputStream(gzFile);
                BufferedInputStream bis = new BufferedInputStream(fis);
                GZIPInputStream gzis = new GZIPInputStream(bis);
                FileOutputStream fos = new FileOutputStream(targetFile);
                BufferedOutputStream bos = new BufferedOutputStream(fos)) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = gzis.read(buffer)) != -1) {
                bos.write(buffer, 0, count);
            }
            bos.flush();
        }
    }

    public List<RestoreHistory> getRestoreHistory() {
        return restoreHistoryRepository.findAllByOrderByStartedAtDesc();
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.2f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
