
package com.medistock.service;

import com.medistock.dto.RegisterRequest;
import com.medistock.dto.LoginRequest;
import com.medistock.dto.LoginResponse;

import com.medistock.entity.Role;
import com.medistock.entity.User;

import com.medistock.repository.RoleRepository;
import com.medistock.repository.UserRepository;

import com.medistock.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditService auditService) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    // LOGIN
    public LoginResponse login(LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"));

        // Check account status and password
        if (!Boolean.TRUE.equals(user.getActive())
                || !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPasswordHash())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password");
        }

        // Check selected role
        String selectedRole = request.getRole();
        String actualRole = user.getRole().getRoleName();

        if (selectedRole == null
                || !actualRole.equalsIgnoreCase(selectedRole.trim())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Selected role does not match your account");
        }

        // Generate JWT token
        String token = jwtService.generateToken(user.getEmail());

        String roleName = user.getRole().getRoleName();

        auditService.record("LOGIN", "USER", user.getUserId(),
                "Logged in as " + roleName, email);

        return new LoginResponse(token, "Bearer",
                jwtService.getExpirationSeconds(), roleName);
    }

    // REGISTER
    @Transactional
    public String register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is already registered");
        }

        // Allow only these roles during public registration
        String requestedRole = request.getRole();

        if (requestedRole == null
                || (!requestedRole.equalsIgnoreCase("STAFF")
                && !requestedRole.equalsIgnoreCase("PHARMACIST")
                && !requestedRole.equalsIgnoreCase("SUPPLIER"))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid role. Choose STAFF, PHARMACIST, or SUPPLIER");
        }

        // Find selected role in database
        Role role = roleRepository.findByRoleName(
                requestedRole.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selected role not found in database"));

        // Create new user
        User user = new User();

        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setActive(true);

        userRepository.save(user);

        auditService.record("REGISTER", "USER", user.getUserId(),
                "Self-registered with role " + role.getRoleName(), email);

        return "Registration successful";
    }
}
