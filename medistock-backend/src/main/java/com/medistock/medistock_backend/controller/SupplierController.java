package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.entity.Supplier;
import com.medistock.medistock_backend.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAll() {
        return ResponseEntity.ok(supplierRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<Supplier> create(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }
}