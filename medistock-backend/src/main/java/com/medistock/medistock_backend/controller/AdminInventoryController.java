package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.MedicineRequest;
import com.medistock.medistock_backend.dto.MedicineResponse;
import com.medistock.medistock_backend.entity.Medicine;
import com.medistock.medistock_backend.entity.Supplier;
import com.medistock.medistock_backend.repository.MedicineRepository;
import com.medistock.medistock_backend.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
public class AdminInventoryController {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;

    // --- MEDICINES CRUD ---

    @GetMapping("/medicines")
    public ResponseEntity<List<MedicineResponse>> getAllMedicines() {
        List<MedicineResponse> list = medicineRepository.findAll().stream()
                .map(MedicineResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/medicines")
    public ResponseEntity<MedicineResponse> addMedicine(@RequestBody MedicineRequest request) {
        if (medicineRepository.existsByBatchNumber(request.getBatchNumber())) {
            throw new RuntimeException("Medicine with this batch number already exists");
        }

        Medicine medicine = new Medicine();
        medicine.setName(request.getName());
        medicine.setBatchNumber(request.getBatchNumber());
        medicine.setCategory(request.getCategory());
        medicine.setQuantity(request.getQuantity());
        medicine.setMinQuantity(request.getMinQuantity());
        medicine.setManufacturingDate(request.getManufacturingDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setUnitPrice(request.getUnitPrice());

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            medicine.setSupplier(supplier);
        }

        Medicine saved = medicineRepository.save(medicine);
        return ResponseEntity.ok(MedicineResponse.fromEntity(saved));
    }

    @PutMapping("/medicines/{id}")
    public ResponseEntity<MedicineResponse> updateMedicine(@PathVariable Long id, @RequestBody MedicineRequest request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        medicine.setName(request.getName());
        medicine.setBatchNumber(request.getBatchNumber());
        medicine.setCategory(request.getCategory());
        medicine.setQuantity(request.getQuantity());
        medicine.setMinQuantity(request.getMinQuantity());
        medicine.setManufacturingDate(request.getManufacturingDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setUnitPrice(request.getUnitPrice());
        medicine.setUpdatedAt(LocalDateTime.now());

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            medicine.setSupplier(supplier);
        }

        Medicine saved = medicineRepository.save(medicine);
        return ResponseEntity.ok(MedicineResponse.fromEntity(saved));
    }

    @DeleteMapping("/medicines/{id}")
    public ResponseEntity<String> deleteMedicine(@PathVariable Long id) {
        if (!medicineRepository.existsById(id)) {
            throw new RuntimeException("Medicine not found");
        }
        medicineRepository.deleteById(id);
        return ResponseEntity.ok("Medicine deleted successfully");
    }

    // --- DASHBOARD STATS ---

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            List<Medicine> allMeds = medicineRepository.findAll();

            long totalMeds = allMeds.size();

            // Protect against nulls in quantity/minQuantity
            long lowStock = allMeds.stream()
                    .filter(m -> m.getQuantity() != null && m.getMinQuantity() != null && m.getQuantity() <= m.getMinQuantity())
                    .count();

            long expired = allMeds.stream()
                    .filter(m -> m.getExpiryDate() != null && m.getExpiryDate().isBefore(LocalDate.now()))
                    .count();

            long outOfStock = allMeds.stream()
                    .filter(m -> m.getQuantity() != null && m.getQuantity() == 0)
                    .count();

            double totalValue = allMeds.stream()
                    .filter(m -> m.getQuantity() != null && m.getUnitPrice() != null)
                    .mapToDouble(m -> m.getQuantity() * m.getUnitPrice())
                    .sum();

            return ResponseEntity.ok(Map.of(
                    "totalMedicines", totalMeds,
                    "lowStockCount", lowStock,
                    "expiredCount", expired,
                    "outOfStockCount", outOfStock,
                    "totalInventoryValue", Math.round(totalValue * 100.0) / 100.0
            ));
        } catch (Exception e) {
            e.printStackTrace(); // This will print the real error in IntelliJ
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate stats: " + e.getMessage()));
        }
    }

    @GetMapping("/dashboard-categories")
    public ResponseEntity<?> getCategoryStats() {
        try {
            List<Medicine> allMeds = medicineRepository.findAll();

            // Group by category string, count them, and ignore nulls
            Map<String, Long> categoryCounts = allMeds.stream()
                    .filter(m -> m.getCategory() != null && !m.getCategory().trim().isEmpty())
                    .collect(Collectors.groupingBy(Medicine::getCategory, Collectors.counting()));

            // Convert to a list of objects for Recharts
            List<Map<String, Object>> chartData = categoryCounts.entrySet().stream()
                    .map(entry -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("name", entry.getKey());
                        map.put("count", entry.getValue());
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            e.printStackTrace(); // This will print the real error in IntelliJ
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate category stats: " + e.getMessage()));
        }
    }
}