
package com.medistock.controller;

import com.medistock.dto.AdminUserResponse;
import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.repository.RoleRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminController(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @GetMapping
    public Map<String, Object> getAllUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by("userId").descending());

        Page<User> result = search.isBlank()
                ? userRepository.findAll(pageable)
                : userRepository.search(search.trim(), pageable);

        List<AdminUserResponse> content = result.getContent()
                .stream()
                .map(AdminController::toResponse)
                .toList();

        return Map.of(
                "content", content,
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "number", result.getNumber());
    }

    @GetMapping("/{id}")
    public AdminUserResponse getUser(@PathVariable Long id) {
        return toResponse(findUser(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse createUser(@RequestBody CreateUserRequest request) {

        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Email is already registered");
        }

        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        User user = new User();
        user.setFullName(requireName(request.getFullName()));
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(findRole(request.getRole()));
        user.setActive(request.getActive() == null || request.getActive());

        User saved = userRepository.save(user);

        auditService.record("CREATE", "USER", saved.getUserId(),
                "Created user " + saved.getEmail()
                        + " with role " + saved.getRole().getRoleName());

        return toResponse(saved);
    }

    @PutMapping("/{id}")
    public AdminUserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {

        User user = findUser(id);

        String email = normalizeEmail(request.getEmail());
        if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Email is already registered");
        }

        user.setFullName(requireName(request.getFullName()));
        user.setEmail(email);
        user.setRole(findRole(request.getRole()));

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 8) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getActive() != null) {
            preventLastAdminDeactivation(user, request.getActive());
            user.setActive(request.getActive());
        }

        User saved = userRepository.save(user);

        auditService.record("UPDATE", "USER", saved.getUserId(),
                "Updated user " + saved.getEmail());

        return toResponse(saved);
    }

    @PatchMapping("/{id}/status")
    public AdminUserResponse updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {

        Boolean active = body.get("active");
        if (active == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Active status is required");
        }

        User user = findUser(id);
        preventLastAdminDeactivation(user, active);
        user.setActive(active);

        User saved = userRepository.save(user);

        auditService.record(active ? "ACTIVATE" : "DEACTIVATE", "USER",
                saved.getUserId(),
                (active ? "Activated" : "Deactivated") + " user " + saved.getEmail());

        return toResponse(saved);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteUser(@PathVariable Long id) {

        User user = findUser(id);

        if ("ADMIN".equalsIgnoreCase(user.getRole().getRoleName())) {
            long activeAdmins = userRepository.countByRoleRoleNameAndActiveTrue("ADMIN");
            if (activeAdmins <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot delete the last active admin");
            }
        }

        String email = user.getEmail();
        userRepository.delete(user);

        auditService.record("DELETE", "USER", id, "Deleted user " + email);

        return Map.of("message", "User deleted");
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private Role findRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Role is required");
        }
        return roleRepository.findByRoleName(roleName.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Unknown role: " + roleName));
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "A valid email is required");
        }
        return email.trim().toLowerCase();
    }

    private String requireName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Full name is required");
        }
        return fullName.trim();
    }

    private void preventLastAdminDeactivation(User user, boolean newActive) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole().getRoleName());
        boolean wasActive = Boolean.TRUE.equals(user.getActive());
        if (isAdmin && wasActive && !newActive) {
            long activeAdmins = userRepository.countByRoleRoleNameAndActiveTrue("ADMIN");
            if (activeAdmins <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot deactivate the last active admin");
            }
        }
    }

    private static AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().getRoleName(),
                user.getActive());
    }

    public static class CreateUserRequest {
        private String fullName;
        private String email;
        private String password;
        private String role;
        private Boolean active;

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }
    }

    public static class UpdateUserRequest {
        private String fullName;
        private String email;
        private String password;
        private String role;
        private Boolean active;

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }
    }
}
