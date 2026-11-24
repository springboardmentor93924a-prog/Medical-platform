package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.CreateUserRequest;
import com.medistock.medistock.entity.AuditLog;
import com.medistock.medistock.entity.Role;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.AuditLogRepository;
import com.medistock.medistock.repository.RoleRepository;
import com.medistock.medistock.repository.UserRepository;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;

    public AdminController(UserRepository userRepository,
                           RoleRepository roleRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService,
                           CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userRepository.findAllByOrderByUserIdAsc();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping("/users")
    @Transactional
    public ResponseEntity<ApiResponse<User>> createUser(
            @RequestBody CreateUserRequest req,
            HttpServletRequest request) {

        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Full name is required"));
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 6 characters"));
        }

        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("A user with this email already exists"));
        }

        String username = (req.getUsername() != null && !req.getUsername().isBlank())
                ? req.getUsername().trim()
                : email.split("@")[0];

        if (userRepository.existsByUsername(username)) {
            username = username + "_" + (System.currentTimeMillis() % 1000);
        }

        Integer roleId = req.getRoleId() != null ? req.getRoleId() : 3; // Default STAFF

        User user = new User();
        user.setEmail(email);
        user.setFullName(req.getFullName().trim());
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRoleId(roleId);
        user.setPhone(req.getPhone());
        user.setActive(true);

        User saved = userRepository.save(user);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "CREATE_USER",
                "USER",
                saved.getUserId(),
                "Created new user account for " + saved.getFullName() + " (" + saved.getEmail() + ")",
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("User account created successfully", saved));
    }

    @PutMapping("/users/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        if (body.containsKey("fullName") && body.get("fullName") != null) {
            String name = body.get("fullName").toString().trim();
            if (!name.isEmpty()) user.setFullName(name);
        }
        if (body.containsKey("phone")) {
            user.setPhone(body.get("phone") != null ? body.get("phone").toString().trim() : null);
        }
        if (body.containsKey("username") && body.get("username") != null) {
            String un = body.get("username").toString().trim();
            if (!un.isEmpty() && !un.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.existsByUsername(un)) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("Username already taken"));
                }
                user.setUsername(un);
            }
        }
        if (body.containsKey("roleId") && body.get("roleId") != null) {
            int newRoleId = ((Number) body.get("roleId")).intValue();
            // Protect last admin check
            if (user.getRoleId() == 1 && newRoleId != 1) {
                long activeAdminCount = userRepository.findAll().stream()
                        .filter(u -> u.getRoleId() == 1 && Boolean.TRUE.equals(u.getActive()))
                        .count();
                if (activeAdminCount <= 1) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(
                            "Operation denied: Cannot demote the last active System Administrator."));
                }
            }
            user.setRoleId(newRoleId);
        }

        User saved = userRepository.save(user);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "UPDATE_USER",
                "USER",
                saved.getUserId(),
                "Updated user profile for " + saved.getFullName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("User profile updated successfully", saved));
    }

    @PatchMapping("/users/{id}/role")
    @Transactional
    public ResponseEntity<ApiResponse<User>> updateUserRole(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Integer newRoleId = null;

        if (body.containsKey("roleId")) {
            newRoleId = ((Number) body.get("roleId")).intValue();
        } else if (body.containsKey("role")) {
            String roleStr = body.get("role").toString().toUpperCase();
            if (roleStr.startsWith("ROLE_")) roleStr = roleStr.substring(5);
            Optional<Role> rOpt = roleRepository.findByRoleName(roleStr);
            if (rOpt.isPresent()) {
                newRoleId = rOpt.get().getRoleId();
            }
        }

        if (newRoleId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Valid roleId or role name required"));
        }

        // Protect last active administrator check
        if (user.getRoleId() == 1 && newRoleId != 1) {
            long activeAdminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRoleId() == 1 && Boolean.TRUE.equals(u.getActive()))
                    .count();
            if (activeAdminCount <= 1) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "Operation denied: Cannot change the role of the last active System Administrator."));
            }
        }

        user.setRoleId(newRoleId);
        User saved = userRepository.save(user);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "ASSIGN_ROLE",
                "USER",
                saved.getUserId(),
                "Assigned role ID " + newRoleId + " to " + saved.getFullName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("User role updated successfully", saved));
    }

    @PatchMapping("/users/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<User>> toggleUserStatus(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Boolean> body,
            HttpServletRequest request) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        boolean newActive = (body != null && body.containsKey("active"))
                ? body.get("active")
                : !Boolean.TRUE.equals(user.getActive());

        // Safety check: Never deactivate the last active administrator!
        if (user.getRoleId() == 1 && !newActive) {
            long activeAdminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRoleId() == 1 && Boolean.TRUE.equals(u.getActive()))
                    .count();
            if (activeAdminCount <= 1) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "Security Protection: Cannot deactivate the last active System Administrator account."));
            }
        }

        user.setActive(newActive);
        User saved = userRepository.save(user);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "UPDATE_USER_STATUS",
                "USER",
                saved.getUserId(),
                (newActive ? "Activated" : "Deactivated") + " user account for " + saved.getFullName(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("User status updated", saved));
    }

    @PostMapping("/users/{id}/reset-password")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 6 characters."));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "RESET_PASSWORD",
                "USER",
                user.getUserId(),
                "Reset password for user " + user.getFullName() + " (" + user.getEmail() + ")",
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Password has been reset successfully.", null));
    }
}
