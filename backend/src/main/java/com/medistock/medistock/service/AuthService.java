 package com.medistock.medistock.service;

import com.medistock.medistock.dto.LoginRequest;
import com.medistock.medistock.dto.LoginResponse;
import com.medistock.medistock.dto.UserProfileResponse;
import com.medistock.medistock.entity.Role;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.RoleRepository;
import com.medistock.medistock.repository.UserRepository;
import com.medistock.medistock.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    // Rule 12: Rate limit invalid login attempts (Max 5 failed attempts within 15 minutes)
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000L;

    private static class LoginAttemptTracker {
        int count;
        long timestamp;

        LoginAttemptTracker(int count, long timestamp) {
            this.count = count;
            this.timestamp = timestamp;
        }
    }

    private final java.util.concurrent.ConcurrentHashMap<String, LoginAttemptTracker> attemptCache = new java.util.concurrent.ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    private void checkRateLimit(String identifier) {
        LoginAttemptTracker tracker = attemptCache.get(identifier);
        if (tracker != null) {
            long elapsed = System.currentTimeMillis() - tracker.timestamp;
            if (elapsed < LOCKOUT_DURATION_MS && tracker.count >= MAX_FAILED_ATTEMPTS) {
                long minutesLeft = Math.max(1, (LOCKOUT_DURATION_MS - elapsed) / 60000);
                throw new BadCredentialsException(
                    "Too many failed login attempts. For security, your account is temporarily locked for " + minutesLeft + " more minute(s). Please try again later or reset your password."
                );
            } else if (elapsed >= LOCKOUT_DURATION_MS) {
                attemptCache.remove(identifier);
            }
        }
    }

    private void recordFailedAttempt(String identifier) {
        long now = System.currentTimeMillis();
        attemptCache.compute(identifier, (key, tracker) -> {
            if (tracker == null || (now - tracker.timestamp >= LOCKOUT_DURATION_MS)) {
                return new LoginAttemptTracker(1, now);
            } else {
                tracker.count += 1;
                tracker.timestamp = now;
                return tracker;
            }
        });
    }

    private void clearFailedAttempts(String identifier) {
        attemptCache.remove(identifier);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new BadCredentialsException("Invalid email/username or password.");
        }

        String identifier = request.getEmail().trim().toLowerCase();

        // Check if rate limited
        checkRateLimit(identifier);

        // 1. Locate user by email OR username
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElse(null);

        if (user == null) {
            recordFailedAttempt(identifier);
            throw new BadCredentialsException("Invalid email/username or password.");
        }

        // 2. Reject inactive/unapproved accounts
        if (Boolean.FALSE.equals(user.getActive())) {
            throw new DisabledException("Account is inactive or pending administrator approval. Please contact your system administrator.");
        }

        // 3. Verify BCrypt password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            recordFailedAttempt(identifier);
            throw new BadCredentialsException("Invalid email/username or password.");
        }

        // Clear attempts on successful authentication
        clearFailedAttempts(identifier);

        // 4. Resolve role strictly from database
        String canonicalRole = "STAFF";
        if (user.getRoleId() != null) {
            Role role = roleRepository.findById(user.getRoleId()).orElse(null);
            if (role != null && role.getRoleName() != null) {
                canonicalRole = role.getRoleName().trim().toUpperCase();
            }
        }

        // 5. Generate secure JWT token
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getUserId(),
                canonicalRole,
                user.getFullName()
        );

        return new LoginResponse(
                token,
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                canonicalRole
        );
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        String canonicalRole = "STAFF";
        if (user.getRoleId() != null) {
            Role role = roleRepository.findById(user.getRoleId()).orElse(null);
            if (role != null && role.getRoleName() != null) {
                canonicalRole = role.getRoleName().trim().toUpperCase();
            }
        }

        return new UserProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getUsername(),
                canonicalRole,
                user.getPhone()
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, String fullName, String phone, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }
        if (phone != null) {
            user.setPhone(phone.trim());
        }
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            if (newPassword.trim().length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters long.");
            }
            if (currentPassword != null && !currentPassword.isEmpty()) {
                if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                    throw new IllegalArgumentException("Current password does not match.");
                }
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        }

        User saved = userRepository.save(user);

        String canonicalRole = "STAFF";
        if (saved.getRoleId() != null) {
            Role role = roleRepository.findById(saved.getRoleId()).orElse(null);
            if (role != null && role.getRoleName() != null) {
                canonicalRole = role.getRoleName().trim().toUpperCase();
            }
        }

        return new UserProfileResponse(
                saved.getUserId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getUsername(),
                canonicalRole,
                saved.getPhone()
        );
    }

    @Transactional
    public LoginResponse register(com.medistock.medistock.dto.RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        // Enforce strong password requirements: Upper, Lower, Digit, Special Character
        boolean hasUpper = request.getPassword().chars().anyMatch(Character::isUpperCase);
        boolean hasLower = request.getPassword().chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = request.getPassword().chars().anyMatch(Character::isDigit);
        boolean hasSpecial = request.getPassword().chars().anyMatch(ch -> "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?`~".indexOf(ch) >= 0);
        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            throw new IllegalArgumentException("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*...).");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("This email is already registered.");
        }

        // Allowed roles: Admin (1), Pharmacist (2), Staff (3), Supplier (4)
        Integer roleId = 3; // Default Hospital Staff
        if (request.getRoleId() != null) {
            if (request.getRoleId() >= 1 && request.getRoleId() <= 4) {
                roleId = request.getRoleId();
            } else {
                throw new IllegalArgumentException("Invalid role selected. Please choose a valid role.");
            }
        } else if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            String roleUpper = request.getRole().trim().toUpperCase();
            if (roleUpper.contains("ADMIN")) {
                roleId = 1;
            } else if (roleUpper.contains("PHARM")) {
                roleId = 2;
            } else if (roleUpper.contains("STAFF") || roleUpper.contains("NURSE")) {
                roleId = 3;
            } else if (roleUpper.contains("SUPPL") || roleUpper.contains("VENDOR")) {
                roleId = 4;
            } else {
                throw new IllegalArgumentException("Invalid role selected. Please choose a valid role.");
            }
        }

        Role assignedRole = roleRepository.findById(roleId).orElse(null);
        String canonicalRole = (assignedRole != null && assignedRole.getRoleName() != null)
                ? assignedRole.getRoleName().trim().toUpperCase()
                : (roleId == 1 ? "ADMIN" : (roleId == 2 ? "PHARMACIST" : (roleId == 4 ? "SUPPLIER" : "STAFF")));

        // Handle optional username
        String username;
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            username = request.getUsername().trim().toLowerCase();
            if (userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username '" + username + "' is already taken. Please choose another username.");
            }
        } else {
            String baseUsername = email.split("@")[0].toLowerCase().replaceAll("[^a-z0-9_.-]", "");
            if (baseUsername.isEmpty()) {
                baseUsername = "user";
            }
            username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + "_" + counter++;
            }
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(request.getFullName().trim());
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRoleId(roleId);
        user.setRole(assignedRole);
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone().trim());
        }
        // Account is immediately activated upon registration (OTP verification removed)
        user.setActive(true);

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(
                savedUser.getEmail(),
                savedUser.getUserId(),
                canonicalRole,
                savedUser.getFullName()
        );

        return new LoginResponse(
                token,
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                canonicalRole
        );
    }

    @Transactional(readOnly = true)
    public String requestPasswordReset(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new IllegalArgumentException("Email address or username is required.");
        }

        String clean = identifier.trim().toLowerCase();
        User user = userRepository.findByEmail(clean)
                .or(() -> userRepository.findByUsername(clean))
                .orElse(null);

        // Security rule: Always respond with a generic success confirmation to prevent account enumeration
        if (user != null) {
            return jwtUtil.generatePasswordResetToken(user.getEmail());
        }
        return null;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (token == null || !jwtUtil.validateToken(token) || !jwtUtil.isPasswordResetToken(token)) {
            throw new IllegalArgumentException("Password reset link is invalid or has expired. Please request a new link.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters long.");
        }

        String email = jwtUtil.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public java.util.List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}
