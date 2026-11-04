package com.medistock.controller;

import com.medistock.entity.Medicine;
import com.medistock.repository.MedicineRepository;
import com.medistock.service.AuditService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Medicine categories are an attribute of a medicine (medicines.category),
 * so a category exists while at least one medicine uses it.
 * These endpoints manage that attribute in bulk.
 */
@RestController
@RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
public class CategoryController {

    private final MedicineRepository medicineRepository;
    private final AuditService auditService;

    public CategoryController(
            MedicineRepository medicineRepository,
            AuditService auditService) {
        this.medicineRepository = medicineRepository;
        this.auditService = auditService;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        Map<String, Integer> counts = new LinkedHashMap<>();

        for (Medicine medicine : medicineRepository.findAll()) {
            String name = clean(medicine.getCategory());
            if (name == null) {
                continue;
            }
            counts.merge(name, 1, Integer::sum);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        counts.forEach((name, count) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", name);
            row.put("medicineCount", count);
            rows.add(row);
        });

        rows.sort(Comparator.comparing(
                row -> String.valueOf(row.get("name")).toLowerCase()));
        return rows;
    }

    /** Create a category by tagging the selected medicines with it. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        String name = clean(asString(body.get("name")));
        if (name == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Category name is required");
        }

        List<Long> medicineIds = asIds(body.get("medicineIds"));
        if (medicineIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Select at least one medicine for this category");
        }

        List<Medicine> changed = new ArrayList<>();
        for (Long id : medicineIds) {
            Medicine medicine = medicineRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Unknown medicine: " + id));
            medicine.setCategory(name);
            changed.add(medicine);
        }
        medicineRepository.saveAll(changed);

        auditService.record(
                "CATEGORY_CREATE", "CATEGORY", null,
                "Created category '" + name + "' with "
                        + changed.size() + " medicine(s)");

        return list();
    }

    /** Rename a category across every medicine that uses it. */
    @PutMapping
    public List<Map<String, Object>> rename(@RequestBody Map<String, Object> body) {
        String oldName = clean(asString(body.get("oldName")));
        String newName = clean(asString(body.get("newName")));

        if (oldName == null || newName == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Both old and new category names are required");
        }
        if (oldName.equalsIgnoreCase(newName)) {
            return list();
        }
        if (exists(newName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Category '" + newName + "' already exists");
        }

        List<Medicine> changed = new ArrayList<>();
        for (Medicine medicine : medicineRepository.findAll()) {
            if (oldName.equalsIgnoreCase(clean(medicine.getCategory()))) {
                medicine.setCategory(newName);
                changed.add(medicine);
            }
        }

        if (changed.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Category '" + oldName + "' not found");
        }

        medicineRepository.saveAll(changed);

        auditService.record(
                "CATEGORY_UPDATE", "CATEGORY", null,
                "Renamed category '" + oldName + "' to '" + newName + "'");

        return list();
    }

    /** Remove a category by clearing it from every medicine that uses it. */
    @DeleteMapping("/{name}")
    public List<Map<String, Object>> delete(@PathVariable String name) {
        String target = clean(name);
        if (target == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Category name is required");
        }

        List<Medicine> changed = new ArrayList<>();
        for (Medicine medicine : medicineRepository.findAll()) {
            if (target.equalsIgnoreCase(clean(medicine.getCategory()))) {
                medicine.setCategory(null);
                changed.add(medicine);
            }
        }

        if (changed.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Category '" + target + "' not found");
        }

        medicineRepository.saveAll(changed);

        auditService.record(
                "CATEGORY_DELETE", "CATEGORY", null,
                "Removed category '" + target + "' from "
                        + changed.size() + " medicine(s)");

        return list();
    }

    private boolean exists(String name) {
        return medicineRepository.findAll().stream()
                .map(medicine -> clean(medicine.getCategory()))
                .filter(Objects::nonNull)
                .anyMatch(name::equalsIgnoreCase);
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static List<Long> asIds(Object value) {
        List<Long> ids = new ArrayList<>();
        if (!(value instanceof List<?> list)) {
            return ids;
        }
        for (Object item : list) {
            if (item instanceof Number number) {
                ids.add(number.longValue());
            } else if (item != null) {
                try {
                    ids.add(Long.parseLong(String.valueOf(item)));
                } catch (NumberFormatException ignored) {
                    // skip malformed ids
                }
            }
        }
        return ids;
    }

    private static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
