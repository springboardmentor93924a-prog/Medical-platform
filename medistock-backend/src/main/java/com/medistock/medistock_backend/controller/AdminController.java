package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.AuthResponse;
import com.medistock.medistock_backend.dto.RegisterRequest;
import com.medistock.medistock_backend.entity.Role;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.RoleRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<AuthResponse.UserDto>> getAllUsers() {
        List<AuthResponse.UserDto> users = userRepository.findAll()
                .stream()
                .map(AuthResponse.UserDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
    // Toggle Active/Inactive
    @PutMapping("/users/{id}/toggle-status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<String> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        return ResponseEntity.ok("User status updated to: " + (user.isEnabled() ? "Enabled" : "Disabled"));
    }

    // --- NEW: CREATE USER ---
    @PostMapping("/users")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> createUserByAdmin(@RequestBody RegisterRequest request) {
        try {
            // 1. Check Email
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Email already exists"));
            }

            // 2. Build User
            User user = new User();
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEnabled(true);

            // 3. Handle Role safely
            String roleName = (request.getRole() != null) ? request.getRole().trim().toUpperCase() : "STAFF";
            if (roleName.startsWith("ROLE_")) {
                roleName = roleName.substring(5); // Remove ROLE_ prefix
            }

            final String finalRoleName = roleName;

            // Auto-create the role if it doesn't exist in the DB
            Role role = roleRepository.findByName(finalRoleName)
                    .orElseGet(() -> {
                        Role newRole = new Role();
                        newRole.setName(finalRoleName);
                        return roleRepository.save(newRole);
                    });

            user.setRoles(Collections.singleton(role));
            userRepository.save(user);

            return ResponseEntity.ok(java.util.Map.of("message", "User created successfully"));

        } catch (Exception e) {
            e.printStackTrace(); // Print the real error in IntelliJ
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Server Error: " + e.getMessage()));
        }
    }


    // --- NEW: DELETE USER ---
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        // Optional: Prevent admin from deleting themselves
        User user = userRepository.findById(id).get();
        if (user.getEmail().equals("sanchitnimse145@gmail.com")) {
            throw new RuntimeException("Cannot delete the main admin account");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    // Edit User Details
    @PutMapping("/users/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody RegisterRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        return ResponseEntity.ok("User updated successfully");
    }


}