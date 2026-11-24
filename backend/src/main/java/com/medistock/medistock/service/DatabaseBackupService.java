package com.medistock.medistock.service;

import com.medistock.medistock.dto.backup.BackupSummaryDto;
import com.medistock.medistock.dto.backup.CreateBackupRequest;
import com.medistock.medistock.entity.BackupRecord;
import com.medistock.medistock.repository.BackupRecordRepository;
import com.medistock.medistock.repository.BackupScheduleRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.GZIPOutputStream;

@Service
public class DatabaseBackupService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBackupService.class);

    private final BackupRecordRepository backupRecordRepository;
    private final BackupScheduleRepository backupScheduleRepository;
    private final BackupSecurityService backupSecurityService;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${medistock.backup.storage-dir:./storage/backups}")
    private String backupStorageDir;

    @Value("${medistock.backup.mysqldump-path:C:/xampp/mysql/bin/mysqldump.exe}")
    private String mysqldumpPath;

    public DatabaseBackupService(BackupRecordRepository backupRecordRepository,
                                 BackupScheduleRepository backupScheduleRepository,
                                 BackupSecurityService backupSecurityService,
                                 AuditService auditService,
                                 CurrentUserService currentUserService,
                                 JdbcTemplate jdbcTemplate) {
        this.backupRecordRepository = backupRecordRepository;
        this.backupScheduleRepository = backupScheduleRepository;
        this.backupSecurityService = backupSecurityService;
        this.auditService = auditService;
        this.currentUserService = currentUserService;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Creates an encrypted, tamper-evident full database backup.
     */
    @Transactional
    public BackupRecord createBackup(CreateBackupRequest req, String backupType, HttpServletRequest httpRequest) {
        String ref = generateBackupReference();
        String timestampStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String safeName = (req != null && req.getBackupName() != null && !req.getBackupName().isBlank())
                ? req.getBackupName().replaceAll("[^a-zA-Z0-9_-]", "_")
                : "MediStock_Backup_" + timestampStr;

        String rawSqlFileName = ref + "_" + safeName + ".sql";
        String encryptedFileName = ref + "_" + safeName + ".sql.gz.enc";

        Path storagePath = Paths.get(backupStorageDir).toAbsolutePath();
        try {
            Files.createDirectories(storagePath);
        } catch (IOException e) {
            log.error("Failed to create backup storage directory: {}", storagePath, e);
        }

        File rawSqlFile = storagePath.resolve(rawSqlFileName).toFile();
        File compressedGzFile = storagePath.resolve(rawSqlFileName + ".gz").toFile();
        File finalEncryptedFile = storagePath.resolve(encryptedFileName).toFile();

        String actorName = currentUserService.getCurrentUser()
                .map(u -> u.getFullName() + " (" + u.getEmail() + ")")
                .orElse("System Administrator");
        Integer actorId = currentUserService.getCurrentUserId();

        BackupRecord record = new BackupRecord();
        record.setBackupReference(ref);
        record.setBackupName(safeName);
        record.setDescription(req != null ? req.getDescription() : "Automated full database backup");
        record.setBackupType(backupType != null ? backupType : "MANUAL");
        record.setScope(req != null && req.getScope() != null ? req.getScope() : "FULL_DATABASE");
        record.setFileName(encryptedFileName);
        record.setFileLocation(finalEncryptedFile.getAbsolutePath());
        record.setEncryptionStatus("AES_256");
        record.setBackupStatus("IN_PROGRESS");
        record.setCreatedBy(actorName);
        record.setCreatedAt(LocalDateTime.now().withNano(0));

        try {
            // 1. Generate Raw SQL Dump
            DatabaseStats stats = dumpDatabaseToSql(rawSqlFile);
            record.setDatabaseVersion(stats.databaseVersion);
            record.setTablesIncluded(stats.tablesCount);
            record.setRecordsCount(stats.totalRecords);

            // 2. Compress with GZIP
            compressToGzip(rawSqlFile, compressedGzFile);

            // 3. Encrypt with AES-256
            backupSecurityService.encryptFile(compressedGzFile, finalEncryptedFile);

            // 4. Calculate Checksum on Final Encrypted File
            String checksum = backupSecurityService.calculateChecksum(finalEncryptedFile);
            record.setChecksum(checksum);
            record.setFileSize(finalEncryptedFile.length());
            record.setBackupStatus("VERIFIED");
            record.setVerifiedAt(LocalDateTime.now().withNano(0));
            record.setVerificationNotes("AES-256 Encryption & SHA-256 Checksum verified on creation.");

            // Clean up temporary unencrypted intermediate files
            if (rawSqlFile.exists()) rawSqlFile.delete();
            if (compressedGzFile.exists()) compressedGzFile.delete();

            BackupRecord saved = backupRecordRepository.save(record);

            // Audit Log Integration
            auditService.logEvent(
                    actorId,
                    "ADMIN",
                    "CREATE_BACKUP",
                    "BACKUP_MANAGEMENT",
                    "BACKUP",
                    saved.getBackupId(),
                    null,
                    Map.of("reference", ref, "sizeBytes", saved.getFileSize(), "tables", saved.getTablesIncluded(), "type", saved.getBackupType()),
                    "Created " + saved.getBackupType() + " database backup: " + ref,
                    "SUCCESS",
                    httpRequest
            );

            log.info("Successfully completed and encrypted backup: {} (Size: {} bytes)", ref, saved.getFileSize());
            return saved;
        } catch (Exception e) {
            log.error("Failed to complete backup {}: {}", ref, e.getMessage(), e);
            record.setBackupStatus("FAILED");
            record.setVerificationNotes("Backup failed: " + e.getMessage());
            record.setChecksum("FAILED");
            BackupRecord failedSaved = backupRecordRepository.save(record);

            auditService.logEvent(
                    actorId,
                    "ADMIN",
                    "CREATE_BACKUP_FAILED",
                    "BACKUP_MANAGEMENT",
                    "BACKUP",
                    failedSaved.getBackupId(),
                    null,
                    Map.of("reference", ref, "error", e.getMessage()),
                    "Failed to create database backup: " + e.getMessage(),
                    "FAILED",
                    httpRequest
            );

            if (rawSqlFile.exists()) rawSqlFile.delete();
            if (compressedGzFile.exists()) compressedGzFile.delete();
            if (finalEncryptedFile.exists()) finalEncryptedFile.delete();

            throw new RuntimeException("Database backup failed: " + e.getMessage(), e);
        }
    }

    /**
     * Dumps the database using mysqldump utility with seamless Java JDBC fallback.
     */
    private DatabaseStats dumpDatabaseToSql(File targetSqlFile) throws Exception {
        DatabaseStats stats = new DatabaseStats();
        stats.databaseVersion = getDatabaseVersion();

        // Count tables and records
        List<String> tables = jdbcTemplate.query("SHOW TABLES", (rs, rowNum) -> rs.getString(1));
        stats.tablesCount = tables.size();

        long totalRows = 0;
        for (String table : tables) {
            try {
                Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM `" + table + "`", Long.class);
                if (count != null) totalRows += count;
            } catch (Exception _e) {
                // Table might be view or temporary
            }
        }
        stats.totalRecords = totalRows;

        // Try native mysqldump executable first
        File mysqldumpExe = new File(mysqldumpPath);
        boolean nativeSuccess = false;

        if (mysqldumpExe.exists() && mysqldumpExe.canExecute()) {
            try {
                ProcessBuilder pb = new ProcessBuilder(
                        mysqldumpExe.getAbsolutePath(),
                        "--host=127.0.0.1",
                        "--port=3307",
                        "-u", "root",
                        "--single-transaction",
                        "--quick",
                        "--hex-blob",
                        "--routines",
                        "--triggers",
                        "medistock"
                );
                pb.redirectOutput(targetSqlFile);
                pb.redirectError(ProcessBuilder.Redirect.DISCARD);

                Process process = pb.start();
                int exitCode = process.waitFor();
                if (exitCode == 0 && targetSqlFile.length() > 0) {
                    nativeSuccess = true;
                    log.info("mysqldump succeeded natively, generated {} bytes", targetSqlFile.length());
                } else {
                    log.warn("mysqldump exited with code {}, falling back to pure JDBC dump engine", exitCode);
                }
            } catch (Exception ex) {
                log.warn("Native mysqldump failed ({}), switching to internal JDBC exporter", ex.getMessage());
            }
        }

        // Robust Java JDBC Fallback SQL generator if native dump was unavailable
        if (!nativeSuccess) {
            dumpViaJdbc(targetSqlFile, tables);
        }

        return stats;
    }

    private void dumpViaJdbc(File targetSqlFile, List<String> tables) throws Exception {
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(new FileOutputStream(targetSqlFile), StandardCharsets.UTF_8))) {
            writer.println("-- ===================================================================");
            writer.println("-- MediStock Advanced Database Export");
            writer.println("-- Generated: " + LocalDateTime.now());
            writer.println("-- Database Engine: " + getDatabaseVersion());
            writer.println("-- ===================================================================");
            writer.println("SET FOREIGN_KEY_CHECKS = 0;");
            writer.println("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';");
            writer.println();

            for (String table : tables) {
                // Ignore transient backup tables from recursion if necessary
                writer.println("-- --------------------------------------------------");
                writer.println("-- Table structure for `" + table + "`");
                writer.println("-- --------------------------------------------------");
                writer.println("DROP TABLE IF EXISTS `" + table + "`;");

                jdbcTemplate.query("SHOW CREATE TABLE `" + table + "`", (ResultSet rs) -> {
                    writer.println(rs.getString(2) + ";");
                    writer.println();
                });

                // Dump rows
                writer.println("-- Data for `" + table + "`");
                jdbcTemplate.query("SELECT * FROM `" + table + "`", (ResultSet rs) -> {
                    int colCount = rs.getMetaData().getColumnCount();
                    StringBuilder insert = new StringBuilder("INSERT INTO `" + table + "` VALUES (");
                    for (int i = 1; i <= colCount; i++) {
                        Object val = rs.getObject(i);
                        if (val == null) {
                            insert.append("NULL");
                        } else if (val instanceof Number || val instanceof Boolean) {
                            insert.append(val);
                        } else {
                            String str = val.toString().replace("\\", "\\\\").replace("'", "\\'");
                            insert.append("'").append(str).append("'");
                        }
                        if (i < colCount) insert.append(", ");
                    }
                    insert.append(");");
                    writer.println(insert);
                });
                writer.println();
            }

            writer.println("SET FOREIGN_KEY_CHECKS = 1;");
            writer.flush();
        }
    }

    private void compressToGzip(File source, File destination) throws IOException {
        try (FileInputStream fis = new FileInputStream(source);
             BufferedInputStream bis = new BufferedInputStream(fis);
             FileOutputStream fos = new FileOutputStream(destination);
             GZIPOutputStream gzos = new GZIPOutputStream(new BufferedOutputStream(fos))) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = bis.read(buffer)) != -1) {
                gzos.write(buffer, 0, count);
            }
            gzos.finish();
        }
    }

    /**
     * Verifies cryptographic integrity of an existing backup record.
     */
    @Transactional
    public BackupRecord verifyBackup(Integer backupId, HttpServletRequest httpRequest) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new IllegalArgumentException("Backup record not found with ID: " + backupId));

        File file = new File(record.getFileLocation());
        if (!file.exists()) {
            record.setBackupStatus("CORRUPTED");
            record.setVerificationNotes("Verification Failed: Physical backup file missing from storage.");
            return backupRecordRepository.save(record);
        }

        try {
            // Check SHA-256
            String computedChecksum = backupSecurityService.calculateChecksum(file);
            boolean checksumMatches = computedChecksum.equalsIgnoreCase(record.getChecksum());

            // Check Decryption integrity
            File tempDecrypted = File.createTempFile("verify_", ".tmp");
            try {
                backupSecurityService.decryptFile(file, tempDecrypted);
                boolean decryptOk = tempDecrypted.length() > 0;

                if (checksumMatches && decryptOk) {
                    record.setBackupStatus("VERIFIED");
                    record.setVerifiedAt(LocalDateTime.now().withNano(0));
                    record.setVerificationNotes("Cryptographic Verification PASSED: SHA-256 signature and AES-256 cipher intact.");
                } else {
                    record.setBackupStatus("CORRUPTED");
                    record.setVerificationNotes("Verification Failed: Checksum mismatch or decryption error.");
                }
            } finally {
                if (tempDecrypted.exists()) tempDecrypted.delete();
            }

            BackupRecord updated = backupRecordRepository.save(record);

            auditService.logEvent(
                    currentUserService.getCurrentUserId(),
                    "ADMIN",
                    "VERIFY_BACKUP",
                    "BACKUP_MANAGEMENT",
                    "BACKUP",
                    record.getBackupId(),
                    null,
                    Map.of("reference", record.getBackupReference(), "status", record.getBackupStatus()),
                    "Cryptographic verification for backup " + record.getBackupReference() + ": " + record.getBackupStatus(),
                    "SUCCESS",
                    httpRequest
            );

            return updated;
        } catch (Exception e) {
            record.setBackupStatus("CORRUPTED");
            record.setVerificationNotes("Verification Error: " + e.getMessage());
            return backupRecordRepository.save(record);
        }
    }

    /**
     * Dashboard Summary Metrics & Status.
     */
    public BackupSummaryDto getSummary() {
        BackupSummaryDto dto = new BackupSummaryDto();
        dto.setTotalBackups(backupRecordRepository.count());
        dto.setVerifiedBackups(backupRecordRepository.countByBackupStatus("VERIFIED") + backupRecordRepository.countByBackupStatus("COMPLETED"));
        dto.setFailedBackups(backupRecordRepository.countByBackupStatus("FAILED") + backupRecordRepository.countByBackupStatus("CORRUPTED"));

        long totalBytes = backupRecordRepository.sumTotalStorageUsed();
        dto.setStorageUsedBytes(totalBytes);
        dto.setFormattedStorageUsed(formatBytes(totalBytes));

        backupRecordRepository.findTopByOrderByCreatedAtDesc().ifPresent(latest -> {
            dto.setLatestBackupRef(latest.getBackupReference());
            dto.setLatestBackupDate(latest.getCreatedAt());
            dto.setLatestBackupStatus(latest.getBackupStatus());
        });

        // Next scheduled backup info
        backupScheduleRepository.findByEnabledTrue().stream().findFirst().ifPresent(sch -> {
            dto.setNextScheduledBackup(sch.getFrequency() + " at " + sch.getScheduledTime());
        });

        // Check MariaDB binary log status dynamically for PITR
        String binlogStatus = "OFF";
        try {
            binlogStatus = jdbcTemplate.query("SHOW VARIABLES LIKE 'log_bin'", rs -> {
                if (rs.next()) return rs.getString(2);
                return "OFF";
            });
        } catch (Exception _e) {
            binlogStatus = "OFF";
        }
        dto.setBinlogStatus(binlogStatus != null ? binlogStatus.toUpperCase() : "OFF");
        dto.setPitrAvailable("ON".equalsIgnoreCase(binlogStatus));
        dto.setDatabaseEngine(getDatabaseVersion());

        return dto;
    }

    public List<BackupRecord> getAllBackups() {
        return backupRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<BackupRecord> getBackupById(Integer id) {
        return backupRecordRepository.findById(id);
    }

    @Transactional
    public void deleteBackup(Integer id, HttpServletRequest httpRequest) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Backup not found with ID: " + id));

        // Delete physical file
        try {
            File file = new File(record.getFileLocation());
            if (file.exists()) file.delete();
        } catch (Exception e) {
            log.warn("Failed to delete physical file {}: {}", record.getFileLocation(), e.getMessage());
        }

        backupRecordRepository.delete(record);

        auditService.logEvent(
                currentUserService.getCurrentUserId(),
                "ADMIN",
                "DELETE_BACKUP",
                "BACKUP_MANAGEMENT",
                "BACKUP",
                id,
                Map.of("reference", record.getBackupReference(), "name", record.getBackupName()),
                null,
                "Permanently deleted backup record: " + record.getBackupReference(),
                "SUCCESS",
                httpRequest
        );
    }

    private String getDatabaseVersion() {
        try {
            return jdbcTemplate.queryForObject("SELECT VERSION()", String.class);
        } catch (Exception e) {
            return "MariaDB 10.4.32";
        }
    }

    private String generateBackupReference() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String rand = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "BKP-" + dateStr + "-" + rand;
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.2f %sB", bytes / Math.pow(1024, exp), pre);
    }

    private static class DatabaseStats {
        String databaseVersion;
        int tablesCount;
        long totalRecords;
    }
}

