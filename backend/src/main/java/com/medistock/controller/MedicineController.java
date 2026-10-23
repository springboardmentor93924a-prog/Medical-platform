
package com.medistock.controller;

import com.medistock.entity.Medicine;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.service.AuditService;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/medicines")
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditService auditService;

    public MedicineController(
            MedicineRepository medicineRepository,
            InventoryRepository inventoryRepository,
            AuditService auditService) {
        this.medicineRepository = medicineRepository;
        this.inventoryRepository = inventoryRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public Medicine createMedicine(@RequestBody Medicine request) {
        validate(request);

        Medicine medicine = new Medicine();
        medicine.setMedicineName(request.getMedicineName().trim());
        medicine.setCategory(trimToNull(request.getCategory()));
        medicine.setDescription(trimToNull(request.getDescription()));

        Medicine saved = medicineRepository.save(medicine);

        auditService.record("CREATE", "MEDICINE", saved.getMedicineId(),
                "Added medicine " + saved.getMedicineName());

        return saved;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public Medicine updateMedicine(
            @PathVariable Long id,
            @RequestBody Medicine request) {

        validate(request);

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Medicine not found"));

        medicine.setMedicineName(request.getMedicineName().trim());
        medicine.setCategory(trimToNull(request.getCategory()));
        medicine.setDescription(trimToNull(request.getDescription()));

        Medicine saved = medicineRepository.save(medicine);

        auditService.record("UPDATE", "MEDICINE", id,
                "Updated medicine " + saved.getMedicineName());

        return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public void deleteMedicine(@PathVariable Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Medicine not found"));

        long batches = inventoryRepository.findAll().stream()
                .filter(i -> id.equals(i.getMedicineId()))
                .count();

        if (batches > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete " + medicine.getMedicineName()
                            + ": it still has " + batches + " inventory batch(es)");
        }

        try {
            medicineRepository.delete(medicine);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete medicine: related records exist");
        }

        auditService.record("DELETE", "MEDICINE", id,
                "Deleted medicine " + medicine.getMedicineName());
    }

    private void validate(Medicine request) {
        if (request.getMedicineName() == null
                || request.getMedicineName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Medicine name is required");
        }
        if (request.getMedicineName().trim().length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Medicine name is too long");
        }
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
