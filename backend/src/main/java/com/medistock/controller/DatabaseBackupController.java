
package com.medistock.controller;

import com.medistock.backup.DatabaseBackupService;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin/database-backups")
public class DatabaseBackupController {

    private static final long MAX_BACKUP_SIZE =
            100L * 1024 * 1024;

    private static final Pattern BACKUP_FILENAME =
            Pattern.compile(
                    "medistock_backup_\\d{8}_\\d{6}\\.zip"
            );

    private static final String RESTORE_CONFIRMATION =
            "RESTORE MEDISTOCK";

    private final DatabaseBackupService backupService;
    private final Path backupDirectory;

    public DatabaseBackupController(
            DatabaseBackupService backupService
    ) {

        this.backupService = backupService;

        this.backupDirectory = Path.of(
                System.getProperty("user.dir"),
                "backups"
        ).toAbsolutePath().normalize();
    }

    // --------------------------------------------------
    // CREATE BACKUP
    // --------------------------------------------------

    @PostMapping
    public ResponseEntity<?> createBackup() throws Exception {

        Path backup = backupService.createBackup();

        return ResponseEntity.ok(Map.of(
                "message",
                "Database backup created successfully",

                "filename",
                backup.getFileName().toString(),

                "size",
                Files.size(backup),

                "createdAt",
                Instant.ofEpochMilli(
                        Files.getLastModifiedTime(backup).toMillis()
                ).toString()
        ));
    }

    // --------------------------------------------------
    // LIST BACKUPS
    // --------------------------------------------------

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getBackups()
            throws Exception {

        Files.createDirectories(backupDirectory);

        try (var files = Files.list(backupDirectory)) {

            List<Map<String, Object>> result = files
                    .filter(Files::isRegularFile)
                    .filter(path -> BACKUP_FILENAME.matcher(
                            path.getFileName().toString()
                    ).matches())
                    .sorted(
                            Comparator.comparing(
                                    (Path path) ->
                                            path.getFileName().toString()
                            ).reversed()
                    )
                    .map(path -> {

                        try {

                            return Map.<String, Object>of(
                                    "filename",
                                    path.getFileName().toString(),

                                    "size",
                                    Files.size(path),

                                    "createdAt",
                                    Files.getLastModifiedTime(path)
                                            .toInstant().toString()
                            );

                        } catch (Exception exception) {

                            throw new RuntimeException(exception);
                        }
                    })
                    .toList();

            return ResponseEntity.ok(result);
        }
    }

    // --------------------------------------------------
    // DOWNLOAD BACKUP
    // --------------------------------------------------

    @GetMapping("/{filename}/download")
    public ResponseEntity<Resource> downloadBackup(
            @PathVariable String filename
    ) {

        if (!BACKUP_FILENAME.matcher(filename).matches()) {
            return ResponseEntity.badRequest().build();
        }

        Path file = backupDirectory
                .resolve(filename)
                .normalize();

        if (!file.startsWith(backupDirectory)
                || !Files.isRegularFile(file)) {

            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType("application/zip")
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\""
                )
                .body(resource);
    }

    // --------------------------------------------------
    // RESTORE BACKUP
    // --------------------------------------------------

    @PostMapping(
            value = "/restore",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> restoreBackup(
            @RequestParam("file") MultipartFile file,
            @RequestParam("confirmation") String confirmation
    ) throws Exception {

        // Verify confirmation.
        if (!RESTORE_CONFIRMATION.equals(confirmation)) {

            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Please provide the exact confirmation text: "
                            + RESTORE_CONFIRMATION
            ));
        }

        // Check uploaded file.
        if (file == null || file.isEmpty()) {

            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Please select a backup file."
            ));
        }

        // Check maximum file size.
        if (file.getSize() > MAX_BACKUP_SIZE) {

            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Backup file cannot exceed 100 MB."
            ));
        }

        // Check file extension.
        String filename = file.getOriginalFilename();

        if (filename == null
                || !filename.toLowerCase().endsWith(".zip")) {

            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Only MediStock ZIP backup files are supported."
            ));
        }

        // Restore through the validated backup service.
        try (var inputStream = file.getInputStream()) {

            backupService.restoreBackup(inputStream);
        }

        return ResponseEntity.ok(Map.of(
                "message",
                "Database restore completed successfully."
        ));
    }
}
