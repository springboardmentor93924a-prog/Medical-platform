package com.medistock.backend.controller;

import com.medistock.backend.dto.ReturnDtos.*;
import com.medistock.backend.service.ReturnService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {
    private final ReturnService service;

    public ReturnController(ReturnService service) { this.service = service; }

    // Admin can see every return. Only the Pharmacist creates and handles them.
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public List<ReturnResponse> list() { return service.list(); }

    @PostMapping
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<ReturnResponse> create(@Valid @RequestBody ReturnRequest r, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(r, auth.getName()));
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ReturnResponse send(@PathVariable Long id, Authentication auth) { return service.send(id, auth.getName()); }

    @PostMapping("/{id}/credit")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ReturnResponse credit(@PathVariable Long id, @Valid @RequestBody CreditRequest r) { return service.credit(id, r); }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ReturnResponse cancel(@PathVariable Long id) { return service.cancel(id); }
}
