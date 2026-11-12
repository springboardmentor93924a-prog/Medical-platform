package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.SupplierRequest;
import com.medistock.medistock_backend.entity.Role;
import com.medistock.medistock_backend.entity.Supplier;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.RoleRepository;
import com.medistock.medistock_backend.repository.SupplierRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import com.medistock.medistock_backend.service.AuditService;
import com.medistock.medistock_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/suppliers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_PHARMACIST', 'PHARMACIST')")
public class SupplierController {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> addSupplier(@RequestBody SupplierRequest request) {
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "A user with this email already exists"));
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Password must be at least 6 characters"));
            }

            Supplier supplier = new Supplier();
            supplier.setName(request.getName());
            supplier.setContactPerson(request.getContactPerson());
            supplier.setEmail(request.getEmail());
            supplier.setPhone(request.getPhone());
            supplier.setAddress(request.getAddress());
            supplier.setLicenseNumber(request.getLicenseNumber());
            supplier.setLeadTimeDays(request.getLeadTimeDays() != null ? request.getLeadTimeDays() : 2);
            supplier.setRating(request.getRating() != null ? request.getRating() : 5.0);
            supplier.setStatus("Active");
            supplierRepository.save(supplier);

            User user = new User();
            user.setFullName(
                    request.getContactPerson() != null && !request.getContactPerson().isBlank()
                            ? request.getContactPerson()
                            : request.getName()
            );
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEnabled(true);

            Role supplierRole = roleRepository.findByName("SUPPLIER")
                    .orElseThrow(() -> new RuntimeException("SUPPLIER role missing from DB"));
            user.setRoles(Collections.singleton(supplierRole));
            userRepository.save(user);

            auditService.log("CREATE_SUPPLIER", "SUPPLIER", supplier.getId(),
                    "Registered " + supplier.getName() + " (" + supplier.getEmail() + ")");

            // Send welcome email with login credentials (fire-and-forget)
            emailService.sendSupplierWelcomeEmail(
                    request.getEmail(),
                    supplier.getName(),
                    request.getContactPerson(),
                    request.getPassword() // raw password — only used here, never stored
            );


            return ResponseEntity.ok(Map.of(
                    "message", "Supplier and login account created successfully",
                    "supplierId", supplier.getId(),
                    "email", request.getEmail()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> updateSupplier(@PathVariable Long id, @RequestBody Supplier updated) {
        try {
            Supplier existing = supplierRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));

            existing.setName(updated.getName());
            existing.setContactPerson(updated.getContactPerson());
            existing.setEmail(updated.getEmail());
            existing.setPhone(updated.getPhone());
            existing.setAddress(updated.getAddress());
            existing.setLicenseNumber(updated.getLicenseNumber());
            existing.setLeadTimeDays(updated.getLeadTimeDays());
            existing.setRating(updated.getRating());

            supplierRepository.save(existing);

            auditService.log("UPDATE_SUPPLIER", "SUPPLIER", id, "Updated " + existing.getName());

            return ResponseEntity.ok(Map.of("message", "Supplier updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        try {
            Supplier supplier = supplierRepository.findById(id).orElse(null);
            String name = supplier != null ? supplier.getName() : ("ID " + id);

            if (supplier != null && supplier.getEmail() != null) {
                userRepository.findByEmail(supplier.getEmail())
                        .ifPresent(userRepository::delete);
            }
            supplierRepository.deleteById(id);

            auditService.log("DELETE_SUPPLIER", "SUPPLIER", id, "Deleted " + name);

            return ResponseEntity.ok(Map.of("message", "Supplier and login account deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Cannot delete supplier. They may be linked to existing medicines or orders."
            ));
        }
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('SUPPLIER', 'ROLE_SUPPLIER')")
    public ResponseEntity<Supplier> getMyProfile(org.springframework.security.core.Authentication authentication) {
        String email = authentication.getName();
        Supplier supplier = supplierRepository.findAll().stream()
                .filter(s -> s.getEmail() != null && s.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Supplier profile not found"));
        return ResponseEntity.ok(supplier);
    }
}