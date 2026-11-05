package com.medistock.medistock.service;

import com.medistock.medistock.dto.AdminUserDto;
import com.medistock.medistock.dto.AdminUserRequestDto;
import com.medistock.medistock.entity.Role;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.RoleRepository;
import com.medistock.medistock.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AdminUserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> getUsers() {
        return userRepository.findAllWithRoles().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<Role> getRoles() {
        return roleRepository.findAll().stream()
                .sorted((left, right) -> left.getRoleName().compareToIgnoreCase(right.getRoleName()))
                .toList();
    }

    @Transactional
    public AdminUserDto createUser(AdminUserRequestDto request) {
        ValidatedUser values = validate(request, true);
        if (userRepository.existsByEmailIgnoreCase(values.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        if (userRepository.existsByUsernameIgnoreCase(values.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This username is already in use.");
        }

        User user = new User();
        apply(user, values, request);
        user.setPassword(passwordEncoder.encode(values.password()));
        return toDto(userRepository.save(user));
    }

    @Transactional
    public AdminUserDto updateUser(Integer userId, AdminUserRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));
        ValidatedUser values = validate(request, false);
        if (userRepository.existsByEmailIgnoreCaseAndUserIdNot(values.email(), userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        if (userRepository.existsByUsernameIgnoreCaseAndUserIdNot(values.username(), userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This username is already in use.");
        }
        if (userId == 1 && (!values.active() || !values.role().getRoleName().equalsIgnoreCase("Admin"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The primary system administrator must remain active with the Admin role.");
        }
        if (user.isActive()
                && user.getRole().getRoleName().equalsIgnoreCase("Admin")
                && (!values.active() || !values.role().getRoleName().equalsIgnoreCase("Admin"))
                && userRepository.countActiveUsersByRoleName("Admin") <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one active administrator account must remain.");
        }

        apply(user, values, request);
        if (values.password() != null) {
            user.setPassword(passwordEncoder.encode(values.password()));
        }
        return toDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));
        if (userId == 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The primary system administrator cannot be deleted.");
        }
        if (user.isActive() && user.getRole().getRoleName().equalsIgnoreCase("Admin")
                && userRepository.countActiveUsersByRoleName("Admin") <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one active administrator account must remain.");
        }
        try {
            if (entityManager != null) {
                entityManager.createNativeQuery("DELETE FROM notification WHERE user_id = :uid").setParameter("uid", userId).executeUpdate();
                entityManager.createNativeQuery("DELETE FROM message WHERE sender_id = :uid OR receiver_id = :uid").setParameter("uid", userId).executeUpdate();
                entityManager.createNativeQuery("UPDATE purchase_order SET user_id = 1 WHERE user_id = :uid").setParameter("uid", userId).executeUpdate();
                entityManager.createNativeQuery("UPDATE sales SET user_id = 1 WHERE user_id = :uid").setParameter("uid", userId).executeUpdate();
                entityManager.createNativeQuery("UPDATE stock_log SET user_id = 1 WHERE user_id = :uid").setParameter("uid", userId).executeUpdate();
                entityManager.createNativeQuery("UPDATE report SET user_id = 1 WHERE user_id = :uid").setParameter("uid", userId).executeUpdate();
            }
            userRepository.delete(user);
            userRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This account is referenced by pharmacy records and cannot be deleted. Deactivate it instead.",
                    exception);
        }
    }

    private ValidatedUser validate(AdminUserRequestDto request, boolean requirePassword) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User account details are required.");
        }
        String username = normalize(request.username());
        String name = normalize(request.name());
        String email = normalize(request.email());
        String phone = normalize(request.phone());
        String password = request.password() == null || request.password().isBlank() ? null : request.password();
        if (username == null || username.length() > 100 || username.contains(" ")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required, cannot contain spaces, and must be at most 100 characters.");
        }
        if (name == null || name.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name is required and must be at most 100 characters.");
        }
        if (email == null || email.length() > 150 || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address (maximum 150 characters).");
        }
        if (phone != null && phone.length() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number must be at most 20 characters.");
        }
        if (request.roleId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a role for this account.");
        }
        if (requirePassword && (password == null || password.length() < 8 || password.length() > 72)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be between 8 and 72 characters.");
        }
        if (!requirePassword && password != null && (password.length() < 8 || password.length() > 72)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be between 8 and 72 characters.");
        }
        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected role does not exist."));
        return new ValidatedUser(username, name, email.toLowerCase(Locale.ROOT), phone, password,
                Boolean.TRUE.equals(request.active()), role);
    }

    private void apply(User user, ValidatedUser values, AdminUserRequestDto request) {
        user.setUsername(values.username());
        user.setName(values.name());
        user.setEmail(values.email());
        user.setPhone(values.phone());
        user.setRole(values.role());
        user.setActive(request.active() == null || values.active());
    }

    private AdminUserDto toDto(User user) {
        String username = user.getUsername();
        if (username == null || username.isBlank()) {
            username = user.getEmail().substring(0, user.getEmail().indexOf('@'));
        }
        return new AdminUserDto(
                user.getUserId(),
                username,
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.isActive(),
                user.getRole().getRoleId(),
                user.getRole().getRoleName());
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record ValidatedUser(
            String username,
            String name,
            String email,
            String phone,
            String password,
            boolean active,
            Role role) {
    }
}
