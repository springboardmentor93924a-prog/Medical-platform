package com.medistock.backend.controller;

import com.medistock.backend.dto.AlertDtos.AlertResponse;
import com.medistock.backend.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {
    private final AlertService service;

    public AlertController(AlertService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF')")
    public List<AlertResponse> list(Authentication auth) {
        // Staff see stock and expiry alerts only. Purchase alerts are for Admin and Pharmacist.
        boolean staff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
        return staff ? service.list() : service.listAll();
    }

    @PostMapping("/expired/{batchId}/remove")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Void> removeExpired(@PathVariable Long batchId, Authentication auth) {
        service.removeExpired(batchId, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
