
package com.medistock.controller;

import com.medistock.entity.Medicine;
import com.medistock.repository.MedicineRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/medicines")
public class MedicineController {

    private final MedicineRepository medicineRepository;

    public MedicineController(
            MedicineRepository medicineRepository) {
        this.medicineRepository = medicineRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }
}
