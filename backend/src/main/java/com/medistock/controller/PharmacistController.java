
package com.medistock.controller;

import com.medistock.dto.ProfileRequest;
import com.medistock.dto.ProfileResponse;
import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.Supplier;
import com.medistock.service.PharmacistService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacist")
@CrossOrigin(origins = "http://localhost:5173")
public class PharmacistController {

    private final PharmacistService pharmacistService;

    public PharmacistController(PharmacistService pharmacistService) {
        this.pharmacistService = pharmacistService;
    }

    // ================= DASHBOARD =================

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(
                pharmacistService.getDashboard()
        );
    }

    // ================= PROFILE =================

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(
            Authentication authentication) {

        return ResponseEntity.ok(
                pharmacistService.getProfile(
                        getAuthenticatedEmail(authentication)
                )
        );
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            Authentication authentication,
            @RequestBody ProfileRequest request) {

        return ResponseEntity.ok(
                pharmacistService.updateProfile(
                        getAuthenticatedEmail(authentication),
                        request
                )
        );
    }

    private String getAuthenticatedEmail(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || "anonymousUser".equals(authentication.getName())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in to access your profile"
            );
        }

        return authentication.getName();
    }

    // ================= STOCK MONITORING =================

    @GetMapping("/stock-monitoring")
    public ResponseEntity<Map<String, Object>> getStockMonitoring() {
        return ResponseEntity.ok(
                pharmacistService.getStockMonitoring()
        );
    }

    // ================= MEDICINES =================

    @GetMapping("/medicines")
    public ResponseEntity<List<Medicine>> getMedicines() {
        return ResponseEntity.ok(
                pharmacistService.getMedicines()
        );
    }

    @GetMapping("/medicines/{id}")
    public ResponseEntity<Medicine> getMedicineById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                pharmacistService.getMedicineById(id)
        );
    }

    @PostMapping("/medicines")
    public ResponseEntity<Medicine> addMedicine(
            @RequestBody Medicine medicine) {

        Medicine savedMedicine =
                pharmacistService.addMedicine(medicine);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedMedicine);
    }

    @PutMapping("/medicines/{id}")
    public ResponseEntity<Medicine> updateMedicine(
            @PathVariable Long id,
            @RequestBody Medicine medicine) {

        return ResponseEntity.ok(
                pharmacistService.updateMedicine(id, medicine)
        );
    }

    @DeleteMapping("/medicines/{id}")
    public ResponseEntity<Void> deleteMedicine(
            @PathVariable Long id) {

        pharmacistService.deleteMedicine(id);

        return ResponseEntity.noContent().build();
    }

    // ================= INVENTORY =================

    @GetMapping("/inventory")
    public ResponseEntity<List<Inventory>> getInventory() {
        return ResponseEntity.ok(
                pharmacistService.getInventory()
        );
    }

    @PostMapping("/inventory")
    public ResponseEntity<Inventory> addInventory(
            @RequestBody Inventory inventory) {

        Inventory savedInventory =
                pharmacistService.addInventory(inventory);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedInventory);
    }

    // UPDATE INVENTORY
    @PutMapping("/inventory/{id}")
    public ResponseEntity<Inventory> updateInventory(
            @PathVariable Long id,
            @RequestBody Inventory inventory) {

        Inventory updatedInventory =
                pharmacistService.updateInventory(id, inventory);

        return ResponseEntity.ok(updatedInventory);
    }

    // DELETE INVENTORY
    @DeleteMapping("/inventory/{id}")
    public ResponseEntity<Void> deleteInventory(
            @PathVariable Long id) {

        pharmacistService.deleteInventory(id);

        return ResponseEntity.noContent().build();
    }

    // ================= LOW STOCK =================

    @GetMapping("/low-stock")
    public ResponseEntity<List<Inventory>> getLowStock() {
        return ResponseEntity.ok(
                pharmacistService.getLowStock()
        );
    }

    // ================= EXPIRED INVENTORY =================

    @GetMapping("/expired")
    public ResponseEntity<List<Inventory>> getExpiredInventory() {
        return ResponseEntity.ok(
                pharmacistService.getExpiredInventory()
        );
    }

    // ================= EXPIRING SOON =================

    @GetMapping("/expiring-soon")
    public ResponseEntity<List<Inventory>> getExpiringSoon() {
        return ResponseEntity.ok(
                pharmacistService.getExpiringSoon()
        );
    }

    // ================= SUPPLIERS =================

    @GetMapping("/suppliers")
    public ResponseEntity<List<Supplier>> getSuppliers() {
        return ResponseEntity.ok(
                pharmacistService.getSuppliers()
        );
    }

    @PostMapping("/suppliers")
    public ResponseEntity<Supplier> addSupplier(
            @RequestBody Supplier supplier) {

        Supplier savedSupplier =
                pharmacistService.addSupplier(supplier);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedSupplier);
    }
}
