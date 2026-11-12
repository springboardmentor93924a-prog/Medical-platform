package com.medistock.medistock_backend.service;

import com.medistock.medistock_backend.dto.LoginRequest;
import com.medistock.medistock_backend.dto.RegisterRequest;
import com.medistock.medistock_backend.dto.AuthResponse;
import com.medistock.medistock_backend.entity.Role;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.RoleRepository;
import com.medistock.medistock_backend.repository.SupplierRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import com.medistock.medistock_backend.security.CustomUserDetailsService;
import com.medistock.medistock_backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final SupplierRepository supplierRepository;   // add if missing
    private final AuditService auditService;               // add if missing

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);
        return new AuthResponse(jwtToken, AuthResponse.UserDto.fromEntity(user));
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());

        String roleName = (request.getRole() != null) ? request.getRole().toUpperCase() : "STAFF";
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        user.setRoles(Collections.singleton(role));
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);
        return new AuthResponse(jwtToken, AuthResponse.UserDto.fromEntity(user));
    }

    public AuthResponse.UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return AuthResponse.UserDto.fromEntity(user);
    }

    @Transactional
    public java.util.Map<String, Object> updateProfile(String currentEmail, java.util.Map<String, String> updates) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update name (used by ProfileView)
        if (updates.containsKey("fullName") && updates.get("fullName") != null && !updates.get("fullName").isBlank()) {
            user.setFullName(updates.get("fullName").trim());
        }
        // Also support "name" as an alias (some React forms use this key)
        if (updates.containsKey("name") && updates.get("name") != null && !updates.get("name").isBlank()) {
            user.setFullName(updates.get("name").trim());
        }

        // Update phone
        if (updates.containsKey("phone")) {
            user.setPhone(updates.get("phone") == null ? "" : updates.get("phone").trim());
        }

        // Update email
        if (updates.containsKey("email") && updates.get("email") != null && !updates.get("email").isBlank()) {
            String newEmail = updates.get("email").trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new RuntimeException("This email is already in use");
                }
                user.setEmail(newEmail);
            }
        }

        // Password change
        if (updates.containsKey("newPassword") && updates.get("newPassword") != null && !updates.get("newPassword").isBlank()) {
            String currentPwd = updates.get("currentPassword");
            if (currentPwd == null || !passwordEncoder.matches(currentPwd, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
            if (updates.get("newPassword").length() < 6) {
                throw new RuntimeException("New password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(updates.get("newPassword")));
        }

        userRepository.save(user);

        // If user is SUPPLIER, sync the suppliers table too
        if (user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("SUPPLIER") || r.getName().equals("ROLE_SUPPLIER"))) {
            supplierRepository.findAll().stream()
                    .filter(s -> s.getEmail() != null && s.getEmail().equalsIgnoreCase(currentEmail))
                    .findFirst()
                    .ifPresent(s -> {
                        s.setEmail(user.getEmail());
                        s.setPhone(user.getPhone());
                        s.setContactPerson(user.getFullName());
                        supplierRepository.save(s);
                    });
        }

        // Audit log (safe if auditService is available)
        try {
            if (auditService != null) {
                auditService.log("UPDATE_PROFILE", "USER", user.getId(), "Profile updated: " + user.getEmail());
            }
        } catch (Exception ignored) {}

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "Profile updated successfully");
        java.util.Map<String, Object> userMap = new java.util.HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("fullName", user.getFullName());
        userMap.put("name", user.getFullName());
        userMap.put("email", user.getEmail());
        userMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
        response.put("user", userMap);
        return response;
    }
}