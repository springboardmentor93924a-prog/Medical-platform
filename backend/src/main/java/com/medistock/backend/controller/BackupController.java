package com.medistock.backend.controller;

import com.medistock.backend.dto.AuthDtos.MessageResponse;
import com.medistock.backend.dto.BackupDtos.*;
import com.medistock.backend.service.BackupService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/backup")
@PreAuthorize("hasRole('ADMIN')")
public class BackupController {
    private final BackupService service;

    public BackupController(BackupService service) { this.service = service; }

    /** A fresh backup of everything, as a file. */
    @GetMapping("/download")
    public ResponseEntity<byte[]> download(Authentication auth) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
            .body(service.exportJson(auth.getName()).getBytes(StandardCharsets.UTF_8));
    }

    /** Saves a backup in the server's backup folder. */
    @PostMapping("/now")
    public MessageResponse saveNow(Authentication auth) {
        return new MessageResponse("Backup saved as " + service.saveToDisk("manual", auth.getName()));
    }

    @GetMapping("/files")
    public BackupList files() { return service.list(); }

    @GetMapping("/files/{name}")
    public ResponseEntity<byte[]> file(@PathVariable String name) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(service.read(name));
    }

    /** Replaces ALL data with the contents of a backup file. */
    @PostMapping("/restore")
    public RestoreResult restore(@RequestBody Map<String, Object> backup, Authentication auth) {
        return service.restore(backup, auth.getName());
    }
}
