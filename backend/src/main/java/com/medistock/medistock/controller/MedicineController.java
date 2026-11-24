package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.CreateMedicineRequest;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final com.medistock.medistock.repository.CategoryRepository categoryRepository;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;
    private final com.medistock.medistock.service.RealtimeEventService realtimeEventService;

    public MedicineController(MedicineRepository medicineRepository,
                              InventoryBatchRepository inventoryBatchRepository,
                              com.medistock.medistock.repository.CategoryRepository categoryRepository,
                              AuditService auditService,
                              CurrentUserService currentUserService,
                              com.medistock.medistock.service.RealtimeEventService realtimeEventService) {
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.categoryRepository = categoryRepository;
        this.auditService = auditService;
        this.currentUserService = currentUserService;
        this.realtimeEventService = realtimeEventService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllMedicines(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId) {

        List<Medicine> medicines;
        if ((search != null && !search.isBlank()) || categoryId != null) {
            medicines = medicineRepository.searchMedicines(search != null ? search.trim() : null, categoryId);
        } else {
            medicines = medicineRepository.findAll();
        }

        List<InventoryBatch> allBatches = inventoryBatchRepository.findAll();

        List<Map<String, Object>> response = new ArrayList<>();
        boolean canViewProcurementCost = currentUserService.hasRole("ADMIN") || currentUserService.hasRole("PHARMACIST");

        for (Medicine m : medicines) {
            List<InventoryBatch> medBatches = allBatches.stream()
                    .filter(b -> m.getMedicineId().equals(b.getMedicineId()))
                    .toList();

            int totalStock = medBatches.stream()
                    .mapToInt(InventoryBatch::getQuantityAvailable)
                    .sum();

            long batchCount = medBatches.size();

            // Find latest batch and earliest active expiring batch
            InventoryBatch latestBatch = medBatches.stream()
                    .max(Comparator.comparing(InventoryBatch::getBatchId))
                    .orElse(null);

            InventoryBatch earliestActiveBatch = medBatches.stream()
                    .filter(b -> b.getQuantityAvailable() > 0 && b.getExpiryDate() != null)
                    .min(Comparator.comparing(InventoryBatch::getExpiryDate))
                    .orElse(latestBatch);

            java.math.BigDecimal unitPrice = latestBatch != null && latestBatch.getSellingPrice() != null
                    ? latestBatch.getSellingPrice()
                    : (latestBatch != null && latestBatch.getPurchaseCost() != null ? latestBatch.getPurchaseCost() : java.math.BigDecimal.valueOf(10.00));

            java.math.BigDecimal purchasePrice = latestBatch != null && latestBatch.getPurchaseCost() != null
                    ? latestBatch.getPurchaseCost()
                    : java.math.BigDecimal.valueOf(5.00);

            String latestBatchNo = latestBatch != null ? latestBatch.getBatchNumber() : null;
            java.time.LocalDate latestExpiry = earliestActiveBatch != null ? earliestActiveBatch.getExpiryDate() : (latestBatch != null ? latestBatch.getExpiryDate() : null);

            String status = totalStock == 0 ? "Out of Stock" : (totalStock <= 50 ? "Low Stock" : "Active");

            Map<String, Object> map = new HashMap<>();
            map.put("medicineId", m.getMedicineId());
            map.put("medicineCode", String.format("MED%03d", m.getMedicineId()));
            map.put("medicineName", m.getMedicineName());
            map.put("brandName", m.getBrandName());
            map.put("genericName", m.getGenericName());
            map.put("strength", m.getStrength());
            map.put("dosageForm", m.getDosageForm());
            map.put("description", m.getDescription());
            map.put("categoryId", m.getCategoryId());
            map.put("category", m.getCategory());
            map.put("categoryName", m.getCategory() != null ? m.getCategory().getCategoryName() : "General");
            map.put("createdAt", m.getCreatedAt());
            map.put("totalStock", totalStock);
            map.put("stockQuantity", totalStock);
            map.put("batchCount", batchCount);
            map.put("unitPrice", unitPrice);
            map.put("sellingPrice", unitPrice);
            // OWASP API3:2023 - Guard sensitive procurement wholesale pricing from unprivileged staff
            if (canViewProcurementCost) {
                map.put("purchasePrice", purchasePrice);
            }
            map.put("latestBatchNumber", latestBatchNo);
            map.put("latestExpiryDate", latestExpiry != null ? latestExpiry.toString() : null);
            map.put("reorderLevel", 50);
            map.put("status", status);
            response.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMedicineById(@PathVariable Integer id) {
        Optional<Medicine> medOpt = medicineRepository.findById(id);
        if (medOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Medicine m = medOpt.get();
        List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(id);
        int totalStock = batches.stream().mapToInt(InventoryBatch::getQuantityAvailable).sum();

        boolean canViewProcurementCost = currentUserService.hasRole("ADMIN") || currentUserService.hasRole("PHARMACIST");
        if (!canViewProcurementCost) {
            // Mask wholesale cost from low-privilege roles
            for (InventoryBatch b : batches) {
                b.setPurchaseCost(null);
            }
        }

        Map<String, Object> map = new HashMap<>();
        map.put("medicineId", m.getMedicineId());
        map.put("medicineName", m.getMedicineName());
        map.put("brandName", m.getBrandName());
        map.put("genericName", m.getGenericName());
        map.put("strength", m.getStrength());
        map.put("dosageForm", m.getDosageForm());
        map.put("description", m.getDescription());
        map.put("categoryId", m.getCategoryId());
        map.put("category", m.getCategory());
        map.put("createdAt", m.getCreatedAt());
        map.put("totalStock", totalStock);
        map.put("batches", batches);

        return ResponseEntity.ok(ApiResponse.ok(map));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Medicine>> createMedicine(
            @RequestBody CreateMedicineRequest req,
            HttpServletRequest request) {

        if (req.getMedicineName() == null || req.getMedicineName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Medicine name is required"));
        }

        if (req.getCategoryId() != null && !categoryRepository.existsById(req.getCategoryId())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid categoryId: Category does not exist"));
        }

        Medicine m = new Medicine();
        m.setMedicineName(req.getMedicineName().trim());
        m.setBrandName(req.getBrandName());
        m.setGenericName(req.getGenericName());
        m.setStrength(req.getStrength());
        m.setDosageForm(req.getDosageForm());
        m.setCategoryId(req.getCategoryId());
        m.setDescription(req.getDescription());

        Medicine saved = medicineRepository.save(m);

        auditService.logEvent(
                currentUserService.getCurrentUserId(),
                currentUserService.getCurrentUserRole(),
                "CREATE_MEDICINE",
                "MEDICINE",
                "MEDICINE",
                saved.getMedicineId(),
                null,
                Map.of(
                        "medicineName", saved.getMedicineName(),
                        "brandName", saved.getBrandName() != null ? saved.getBrandName() : "",
                        "strength", saved.getStrength() != null ? saved.getStrength() : "",
                        "dosageForm", saved.getDosageForm() != null ? saved.getDosageForm() : "",
                        "categoryId", saved.getCategoryId() != null ? saved.getCategoryId() : 0
                ),
                "Added new medicine: " + saved.getMedicineName(),
                "SUCCESS",
                request
        );

        realtimeEventService.publishInventoryEvent(
                "MEDICINE_CREATED",
                saved.getMedicineId(),
                null,
                "New medicine added: " + saved.getMedicineName()
        );

        return ResponseEntity.ok(ApiResponse.ok("Medicine created successfully", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Medicine>> updateMedicine(
            @PathVariable Integer id,
            @RequestBody CreateMedicineRequest req,
            HttpServletRequest request) {

        if (req.getCategoryId() != null && !categoryRepository.existsById(req.getCategoryId())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid categoryId: Category does not exist"));
        }

        return medicineRepository.findById(id).map(m -> {
            Map<String, Object> oldValues = Map.of(
                    "medicineName", m.getMedicineName(),
                    "brandName", m.getBrandName() != null ? m.getBrandName() : "",
                    "strength", m.getStrength() != null ? m.getStrength() : "",
                    "dosageForm", m.getDosageForm() != null ? m.getDosageForm() : "",
                    "categoryId", m.getCategoryId() != null ? m.getCategoryId() : 0
            );

            if (req.getMedicineName() != null && !req.getMedicineName().isBlank()) {
                m.setMedicineName(req.getMedicineName().trim());
            }
            if (req.getBrandName() != null) m.setBrandName(req.getBrandName());
            if (req.getGenericName() != null) m.setGenericName(req.getGenericName());
            if (req.getStrength() != null) m.setStrength(req.getStrength());
            if (req.getDosageForm() != null) m.setDosageForm(req.getDosageForm());
            if (req.getCategoryId() != null) m.setCategoryId(req.getCategoryId());
            if (req.getDescription() != null) m.setDescription(req.getDescription());

            Medicine saved = medicineRepository.save(m);

            Map<String, Object> newValues = Map.of(
                    "medicineName", saved.getMedicineName(),
                    "brandName", saved.getBrandName() != null ? saved.getBrandName() : "",
                    "strength", saved.getStrength() != null ? saved.getStrength() : "",
                    "dosageForm", saved.getDosageForm() != null ? saved.getDosageForm() : "",
                    "categoryId", saved.getCategoryId() != null ? saved.getCategoryId() : 0
            );

            auditService.logEvent(
                    currentUserService.getCurrentUserId(),
                    currentUserService.getCurrentUserRole(),
                    "UPDATE_MEDICINE",
                    "MEDICINE",
                    "MEDICINE",
                    saved.getMedicineId(),
                    oldValues,
                    newValues,
                    "Updated medicine details: " + saved.getMedicineName(),
                    "SUCCESS",
                    request
            );
            realtimeEventService.publishInventoryEvent(
                    "MEDICINE_UPDATED",
                    saved.getMedicineId(),
                    null,
                    "Updated medicine: " + saved.getMedicineName()
            );
            return ResponseEntity.ok(ApiResponse.ok("Medicine updated successfully", saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(@PathVariable Integer id, HttpServletRequest request) {
        return medicineRepository.findById(id).map(m -> {
            List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(id);
            if (!batches.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.<Void>error(
                        "Cannot delete medicine '" + m.getMedicineName() + "': " + batches.size() +
                        " inventory batch(es) exist. Please remove or zero batches first."));
            }

            medicineRepository.delete(m);
            auditService.logEvent(
                    currentUserService.getCurrentUserId(),
                    currentUserService.getCurrentUserRole(),
                    "DELETE_MEDICINE",
                    "MEDICINE",
                    "MEDICINE",
                    id,
                    Map.of(
                            "medicineName", m.getMedicineName(),
                            "medicineId", id
                    ),
                    null,
                    "Deleted medicine: " + m.getMedicineName(),
                    "SUCCESS",
                    request
            );
            return ResponseEntity.ok(ApiResponse.<Void>ok("Medicine deleted successfully", null));
        }).orElse(ResponseEntity.notFound().build());
    }
}
