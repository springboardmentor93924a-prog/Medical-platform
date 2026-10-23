package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.MedicineRequest;
import com.medistock.medistock_backend.dto.MedicineResponse;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.UserRepository;
import com.medistock.medistock_backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    // Helper to get the current logged-in database user
    private User getCurrentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    // 1. GET: Anyone authenticated can view inventory
    @GetMapping
    public ResponseEntity<List<MedicineResponse>> getAllMedicines() {
        return ResponseEntity.ok(inventoryService.getAllMedicines());
    }

    // 2. POST: Only PHARMACIST or ADMIN can add
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineResponse> addMedicine(@RequestBody MedicineRequest request, Authentication auth) {
        return ResponseEntity.ok(inventoryService.addMedicine(request, getCurrentUser(auth)));
    }

    // 3. PUT: Only PHARMACIST or ADMIN can update
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineResponse> updateMedicine(@PathVariable Long id, @RequestBody MedicineRequest request, Authentication auth) {
        return ResponseEntity.ok(inventoryService.updateMedicine(id, request, getCurrentUser(auth)));
    }

    // 4. DELETE: Only ADMIN (Pharmacists usually shouldn't hard-delete medicines)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteMedicine(@PathVariable Long id) {
        inventoryService.deleteMedicine(id);
        return ResponseEntity.ok("Medicine deleted successfully");
    }

    // 5. Adjust Stock (Pharmacist or Admin)
    @PutMapping("/{id}/adjust-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<MedicineResponse> adjustStock(
            @PathVariable Long id,
            @RequestParam Integer delta, // e.g., +5 or -2
            Authentication auth) {

        return ResponseEntity.ok(inventoryService.adjustStock(id, delta, getCurrentUser(auth)));
    }
}