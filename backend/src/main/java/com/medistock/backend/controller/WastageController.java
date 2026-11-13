package com.medistock.backend.controller;

import com.medistock.backend.dto.WastageDtos.*;
import com.medistock.backend.service.WastageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wastage")
@PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
public class WastageController {
    private final WastageService service;

    public WastageController(WastageService service) { this.service = service; }

    @GetMapping
    public WastageResponse wastage() { return service.build(); }

    @PostMapping
    public ResponseEntity<Void> record(@Valid @RequestBody WastageRequest r, Authentication auth) {
        service.record(r, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
