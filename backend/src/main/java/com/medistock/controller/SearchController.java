package com.medistock.controller;

import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.UserRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;

    public SearchController(UserRepository userRepository,
                            MedicineRepository medicineRepository,
                            InventoryRepository inventoryRepository) {
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public Map<String, Object> search(@RequestParam(name = "q", defaultValue = "") String q) {
        String query = q.trim();
        if (query.isEmpty()) {
            return Map.of(
                    "query", "",
                    "users", List.of(),
                    "medicines", List.of(),
                    "inventory", List.of());
        }

        // Only admins may search user accounts (emails/roles).
        boolean includeUsers = false;
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null) {
            includeUsers = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        }

        List<Map<String, Object>> users = includeUsers
                ? userRepository.search(query,
                        org.springframework.data.domain.PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(u -> Map.<String, Object>of(
                        "userId", u.getUserId(),
                        "fullName", u.getFullName(),
                        "email", u.getEmail(),
                        "role", u.getRole().getRoleName(),
                        "active", Boolean.TRUE.equals(u.getActive())))
                .toList()
                : List.of();

        List<Map<String, Object>> medicines = medicineRepository.search(query,
                        org.springframework.data.domain.PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(m -> Map.<String, Object>of(
                        "medicineId", m.getMedicineId(),
                        "medicineName", m.getMedicineName(),
                        "category", m.getCategory() == null ? "" : m.getCategory()))
                .toList();

        List<Map<String, Object>> inventory = inventoryRepository.search(query,
                        org.springframework.data.domain.PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(i -> Map.<String, Object>of(
                        "inventoryId", i.getInventoryId(),
                        "medicineId", i.getMedicineId(),
                        "batchNumber", i.getBatchNumber(),
                        "quantity", i.getQuantity(),
                        "expiryDate", i.getExpiryDate() == null
                                ? "" : i.getExpiryDate().toString()))
                .toList();

        return Map.of(
                "query", query,
                "users", users,
                "medicines", medicines,
                "inventory", inventory);
    }
}
