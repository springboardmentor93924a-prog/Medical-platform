
package com.medistock.controller;

import com.medistock.entity.Supplier;
import com.medistock.repository.SupplierRepository;
import com.medistock.service.AuditService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/suppliers")
public class SupplierController {

    private final SupplierRepository supplierRepository;
    private final AuditService auditService;

    public SupplierController(SupplierRepository supplierRepository,
                              AuditService auditService) {
        this.supplierRepository = supplierRepository;
        this.auditService = auditService;
    }

    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @GetMapping("/{id}")
    public Supplier getSupplier(@PathVariable Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Supplier not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Supplier addSupplier(@RequestBody Supplier request) {
        validateSupplier(request);

        Supplier supplier = new Supplier();
        copyFields(request, supplier);
        supplier.setActive(true);

        Supplier saved = supplierRepository.save(supplier);

        auditService.record("CREATE", "SUPPLIER", saved.getSupplierId(),
                "Added supplier " + saved.getSupplierName());

        return saved;
    }

    @PutMapping("/{id}")
    public Supplier updateSupplier(
            @PathVariable Long id,
            @RequestBody Supplier request) {

        validateSupplier(request);

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Supplier not found"));

        copyFields(request, supplier);

        Supplier saved = supplierRepository.save(supplier);

        auditService.record("UPDATE", "SUPPLIER", id,
                "Updated supplier " + saved.getSupplierName());

        return saved;
    }

    @PatchMapping("/{id}/status")
    public Supplier updateSupplierStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {

        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Supplier not found"));

        if (request.getActive() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Active status is required");
        }

        supplier.setActive(request.getActive());
        Supplier saved = supplierRepository.save(supplier);

        auditService.record(request.getActive() ? "ACTIVATE" : "DEACTIVATE",
                "SUPPLIER", id,
                (request.getActive() ? "Activated" : "Deactivated")
                        + " supplier " + saved.getSupplierName());

        return saved;
    }

    private void validateSupplier(Supplier request) {
        if (request.getSupplierName() == null
                || request.getSupplierName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Supplier name is required");
        }

        if (request.getSupplierName().trim().length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Supplier name is too long");
        }
    }

    private void copyFields(Supplier source, Supplier target) {
        target.setSupplierName(source.getSupplierName().trim());
        target.setContactNumber(source.getContactNumber());
        target.setEmail(source.getEmail());
        target.setAddress(source.getAddress());
    }

    public static class StatusRequest {
        private Boolean active;

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }
}
