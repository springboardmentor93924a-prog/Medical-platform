package com.medistock.backend.controller;

import com.medistock.backend.dto.SettingsDtos.*;
import com.medistock.backend.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final SettingsService service;

    public SettingsController(SettingsService service) { this.service = service; }

    @GetMapping("/public")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF','SUPPLIER')")
    public PublicSettings publicSettings() { return service.publicSettings(); }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SettingsResponse all() { return service.all(); }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SettingsResponse update(@Valid @RequestBody SettingsRequest r, Authentication auth) {
        return service.update(r, auth.getName());
    }
}
