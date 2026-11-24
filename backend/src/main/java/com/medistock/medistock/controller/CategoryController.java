package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.entity.Category;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.repository.CategoryRepository;
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
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;

    public CategoryController(CategoryRepository categoryRepository,
                              MedicineRepository medicineRepository,
                              InventoryBatchRepository inventoryBatchRepository,
                              AuditService auditService,
                              CurrentUserService currentUserService) {
        this.categoryRepository = categoryRepository;
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.auditService = auditService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        List<InventoryBatch> allBatches = inventoryBatchRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Category cat : categories) {
            List<Medicine> meds = medicineRepository.findByCategoryId(cat.getCategoryId());
            int totalUnits = allBatches.stream()
                    .filter(b -> b.getMedicine() != null && cat.getCategoryId().equals(b.getMedicine().getCategoryId()))
                    .mapToInt(InventoryBatch::getQuantityAvailable)
                    .sum();

            Map<String, Object> map = new HashMap<>();
            map.put("categoryId", cat.getCategoryId());
            map.put("categoryName", cat.getCategoryName());
            map.put("description", cat.getDescription());
            map.put("createdAt", cat.getCreatedAt());
            map.put("medicineCount", meds.size());
            map.put("totalStockQuantity", totalUnits);
            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCategoryById(@PathVariable Integer id) {
        Optional<Category> catOpt = categoryRepository.findById(id);
        if (catOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Category cat = catOpt.get();
        List<Medicine> meds = medicineRepository.findByCategoryId(id);

        Map<String, Object> map = new HashMap<>();
        map.put("categoryId", cat.getCategoryId());
        map.put("categoryName", cat.getCategoryName());
        map.put("description", cat.getDescription());
        map.put("createdAt", cat.getCreatedAt());
        map.put("medicines", meds);
        map.put("medicineCount", meds.size());

        return ResponseEntity.ok(ApiResponse.ok(map));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Category category, HttpServletRequest request) {
        if (category.getCategoryName() == null || category.getCategoryName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Category name is required"));
        }
        category.setCategoryName(category.getCategoryName().trim());
        Category saved = categoryRepository.save(category);
        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "CREATE_CATEGORY",
                "CATEGORY",
                saved.getCategoryId(),
                "Created medicine category " + saved.getCategoryName(),
                request
        );
        return ResponseEntity.ok(ApiResponse.ok("Category created successfully", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable Integer id,
            @RequestBody Category updateData,
            HttpServletRequest request) {

        Optional<Category> catOpt = categoryRepository.findById(id);
        if (catOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Category cat = catOpt.get();
        if (updateData.getCategoryName() != null && !updateData.getCategoryName().trim().isEmpty()) {
            cat.setCategoryName(updateData.getCategoryName().trim());
        }
        if (updateData.getDescription() != null) {
            cat.setDescription(updateData.getDescription().trim());
        }

        Category saved = categoryRepository.save(cat);
        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "UPDATE_CATEGORY",
                "CATEGORY",
                saved.getCategoryId(),
                "Updated medicine category " + saved.getCategoryName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Integer id, HttpServletRequest request) {
        Optional<Category> catOpt = categoryRepository.findById(id);
        if (catOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        long refCount = medicineRepository.countByCategoryId(id);
        if (refCount > 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Cannot delete category '" + catOpt.get().getCategoryName() + "': " + refCount +
                    " medicine(s) are currently assigned to it. Please reassign those medicines first."));
        }

        categoryRepository.deleteById(id);
        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "DELETE_CATEGORY",
                "CATEGORY",
                id,
                "Deleted category " + catOpt.get().getCategoryName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Category deleted successfully", null));
    }
}
