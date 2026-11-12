package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.BackupMetadata;
import com.medistock.medistock_backend.service.AuditService;
import com.medistock.medistock_backend.service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/backups")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
public class BackupController {

    private final BackupService backupService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<List<BackupMetadata>> listBackups() throws Exception {
        return ResponseEntity.ok(backupService.listBackups());
    }

    @PostMapping("/create")
    public ResponseEntity<?> createBackup() {
        try {
            BackupMetadata meta = backupService.createBackup();
            auditService.log("CREATE_BACKUP", "SYSTEM", null,
                    "Created backup: " + meta.getFileName() + " (" + meta.getSizeBytes() + " bytes)");
            return ResponseEntity.ok(meta);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/restore/{fileName}")
    public ResponseEntity<?> restoreBackup(@PathVariable String fileName) {
        try {
            Map<String, Object> result = backupService.restoreBackup(fileName);
            auditService.log("RESTORE_BACKUP", "SYSTEM", null,
                    "Restored from: " + fileName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{fileName}")
    public ResponseEntity<?> deleteBackup(@PathVariable String fileName) {
        try {
            backupService.deleteBackup(fileName);
            auditService.log("DELETE_BACKUP", "SYSTEM", null, "Deleted backup: " + fileName);
            return ResponseEntity.ok(Map.of("message", "Backup deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<?> downloadBackup(@PathVariable String fileName) {
        try {
            File file = backupService.getBackupFile(fileName);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(new FileSystemResource(file));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}