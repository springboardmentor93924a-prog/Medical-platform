package com.medistock.controller;

import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.BackupRecord;
import com.medistock.service.BackupService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/backup")
@PreAuthorize("hasRole('ADMIN')")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BackupRecord>> createBackup(@AuthenticationPrincipal UserDetails userDetails) {
        BackupRecord record = backupService.createBackup(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Database backup successfully generated", record));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<BackupRecord>>> getBackupHistory() {
        return ResponseEntity.ok(ApiResponse.success(backupService.getBackupHistory()));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadBackup(@PathVariable Long id) {
        Resource file = backupService.downloadBackup(id);
        String filename = file.getFilename() != null ? file.getFilename() : ("medistock_backup_" + id + ".json");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(file);
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Map<String, Object>>> restoreBackup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> result = backupService.restoreBackup(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Database restored successfully", result));
    }

    @PostMapping("/restore-upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> restoreFromUpload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> result = backupService.restoreFromUpload(file, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Database restored successfully from uploaded file", result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBackup(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        backupService.deleteBackup(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Database backup successfully deleted", null));
    }
}
