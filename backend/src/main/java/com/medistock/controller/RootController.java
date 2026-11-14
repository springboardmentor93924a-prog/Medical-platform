package com.medistock.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("application", "MediStock – Medical Inventory Intelligence Platform API");
        status.put("version", "1.0.0");
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now());
        status.put("message", "API server operational. Connect via the frontend dashboard at http://localhost:5173 or authenticate using /api/v1/auth/login.");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/api/v1/public/status")
    public ResponseEntity<Map<String, Object>> apiStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("application", "MediStock API");
        status.put("version", "1.0.0");
        status.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(status);
    }
}
