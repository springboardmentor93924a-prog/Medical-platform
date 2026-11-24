package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.backup.*;
import com.medistock.medistock.entity.BackupRecord;
import com.medistock.medistock.entity.BackupSchedule;
import com.medistock.medistock.entity.RestoreHistory;
import com.medistock.medistock.service.BackupScheduleService;
import com.medistock.medistock.service.DatabaseBackupService;
import com.medistock.medistock.service.DatabaseRestoreService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class BackupController {

    private final DatabaseBackupService databaseBackupService;
    private final DatabaseRestoreService databaseRestoreService;
    private final BackupScheduleService backupScheduleService;

    public BackupController(DatabaseBackupService databaseBackupService,
                            DatabaseRestoreService databaseRestoreService,
                            BackupScheduleService backupScheduleService) {
        this.databaseBackupService = databaseBackupService;
        this.databaseRestoreService = databaseRestoreService;
        this.backupScheduleService = backupScheduleService;
    }

    // ─── 1. BACKUP MANAGEMENT ENDPOINTS ───

    @GetMapping("/backups")
    public ResponseEntity<ApiResponse<List<BackupRecord>>> getAllBackups() {
        return ResponseEntity.ok(ApiResponse.ok(databaseBackupService.getAllBackups()));
    }

    @GetMapping("/backups/summary")
    public ResponseEntity<ApiResponse<BackupSummaryDto>> getBackupSummary() {
        return ResponseEntity.ok(ApiResponse.ok(databaseBackupService.getSummary()));
    }

    @PostMapping("/backups")
    public ResponseEntity<ApiResponse<BackupRecord>> createBackup(
            @RequestBody(required = false) CreateBackupRequest request,
            HttpServletRequest httpRequest) {
        BackupRecord record = databaseBackupService.createBackup(request, "MANUAL", httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Database backup created and verified successfully.", record));
    }

    @GetMapping("/backups/{id}")
    public ResponseEntity<ApiResponse<BackupRecord>> getBackupById(@PathVariable Integer id) {
        return databaseBackupService.getBackupById(id)
                .map(b -> ResponseEntity.ok(ApiResponse.ok(b)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/backups/{id}/verify")
    public ResponseEntity<ApiResponse<BackupRecord>> verifyBackup(
            @PathVariable Integer id,
            HttpServletRequest httpRequest) {
        BackupRecord record = databaseBackupService.verifyBackup(id, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Backup cryptographic verification completed.", record));
    }

    @GetMapping("/backups/{id}/download")
    public ResponseEntity<Resource> downloadBackup(@PathVariable Integer id) {
        BackupRecord record = databaseBackupService.getBackupById(id)
                .orElseThrow(() -> new IllegalArgumentException("Backup record not found: " + id));

        File file = new File(record.getFileLocation());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + record.getFileName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .header("X-Checksum-SHA256", record.getChecksum())
                .body(resource);
    }

    @DeleteMapping("/backups/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBackup(
            @PathVariable Integer id,
            HttpServletRequest httpRequest) {
        databaseBackupService.deleteBackup(id, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Backup record and physical archive deleted.", null));
    }

    // ─── 2. SCHEDULE & RETENTION ENDPOINTS ───

    @GetMapping("/backups/schedules")
    public ResponseEntity<ApiResponse<List<BackupSchedule>>> getSchedules() {
        return ResponseEntity.ok(ApiResponse.ok(backupScheduleService.getAllSchedules()));
    }

    @PutMapping("/backups/schedules/{id}")
    public ResponseEntity<ApiResponse<BackupSchedule>> updateSchedule(
            @PathVariable Integer id,
            @RequestBody BackupScheduleUpdateRequest request) {
        BackupSchedule updated = backupScheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Backup schedule updated successfully.", updated));
    }

    // ─── 3. RESTORE & RECOVERY ENDPOINTS ───

    @PostMapping("/restores/preview/{backupId}")
    public ResponseEntity<ApiResponse<RestorePreviewDto>> previewRestore(@PathVariable Integer backupId) {
        RestorePreviewDto preview = databaseRestoreService.previewRestore(backupId);
        return ResponseEntity.ok(ApiResponse.ok(preview));
    }

    @PostMapping("/restores/confirm/{backupId}")
    public ResponseEntity<ApiResponse<RestoreHistory>> confirmRestore(
            @PathVariable Integer backupId,
            @Valid @RequestBody ConfirmRestoreRequest request,
            HttpServletRequest httpRequest) {
        RestoreHistory history = databaseRestoreService.confirmAndExecuteRestore(backupId, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Database restoration completed and verified.", history));
    }

    @GetMapping("/restores/history")
    public ResponseEntity<ApiResponse<List<RestoreHistory>>> getRestoreHistory() {
        return ResponseEntity.ok(ApiResponse.ok(databaseRestoreService.getRestoreHistory()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleSecurityException(SecurityException ex) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }
}
