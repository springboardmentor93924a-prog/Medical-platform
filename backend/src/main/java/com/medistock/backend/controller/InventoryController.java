package com.medistock.backend.controller;

import com.medistock.backend.dto.InventoryDtos.*;
import com.medistock.backend.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService service;

    public InventoryController(InventoryService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','STAFF')")
    public List<InventoryRow> list(@RequestParam(required = false) String search,
                                   @RequestParam(required = false) Long categoryId,
                                   @RequestParam(required = false) Long supplierId,
                                   @RequestParam(required = false) String stock,
                                   @RequestParam(required = false) String expiry) {
        return service.list(search, categoryId, supplierId, stock, expiry);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<InventoryRow> create(@Valid @RequestBody InventoryRequest r, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(r, auth.getName()));
    }

    @PutMapping("/{batchId}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public InventoryRow update(@PathVariable Long batchId, @Valid @RequestBody InventoryRequest r) {
        return service.update(batchId, r);
    }

    @DeleteMapping("/medicines/{medicineId}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<Void> delete(@PathVariable Long medicineId) {
        service.deleteMedicine(medicineId);
        return ResponseEntity.noContent().build();
    }
}
