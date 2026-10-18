
package com.medistock.medistock.controller;

import com.medistock.medistock.entity.Role;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.RoleRepository;
import com.medistock.medistock.repository.UserRepository;
import com.medistock.medistock.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public record LoginRequest(
            String email,
            String password,
            String role) {
    }

    public record SignupRequest(
            String name,
            String email,
            String password,
            String phone,
            String role) {
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        if (request.email() == null
                || request.email().isBlank()
                || request.password() == null
                || request.password().isBlank()
                || request.role() == null
                || request.role().isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Email, password and role are required"));
        }

        Optional<User> optionalUser =
                userRepository.findByEmail(
                        request.email().trim());

        if (optionalUser.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid email or password"));
        }

        User user = optionalUser.get();

        // Verify password
        if (!passwordEncoder.matches(
                request.password(),
                user.getPassword())) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid email or password"));
        }

        // Get the actual role from the database
        String actualRole = user.getRole().getRoleName();

        // Verify the selected role
        if (!actualRole.equalsIgnoreCase(
                request.role().trim())) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "Selected role does not match this account"));
        }

        // Generate JWT only after successful verification
        String token = jwtService.generateToken(
                user.getEmail(),
                actualRole);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Login successful",
                        "token", token,
                        "tokenType", "Bearer",
                        "userId", user.getUserId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", actualRole
                ));
    }

    // SIGN UP
    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @RequestBody SignupRequest request) {

        if (request.name() == null
                || request.name().isBlank()
                || request.email() == null
                || request.email().isBlank()
                || request.password() == null
                || request.password().length() < 8
                || request.role() == null
                || request.role().isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Name, email, role and a password of at least 8 characters are required"));
        }

        String email = request.email().trim();
        String requestedRole =
                request.role().trim().toLowerCase();

        // Admin registration is not allowed publicly
        if (!requestedRole.equals("staff")
                && !requestedRole.equals("supplier")
                && !requestedRole.equals("pharmacist")) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "Public registration is allowed only for Staff, Supplier and Pharmacist"));
        }

        // Prevent duplicate email registration
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "An account with this email already exists"));
        }

        Optional<Role> optionalRole =
                roleRepository.findByRoleNameIgnoreCase(
                        requestedRole);

        if (optionalRole.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "The selected role does not exist in the database"));
        }

        // Create the new user
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(
                passwordEncoder.encode(request.password()));

        user.setPhone(
                request.phone() == null
                        || request.phone().isBlank()
                        ? null
                        : request.phone().trim());

        user.setRole(optionalRole.get());

        User savedUser = userRepository.save(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Account created successfully",
                        "userId", savedUser.getUserId(),
                        "name", savedUser.getName(),
                        "email", savedUser.getEmail(),
                        "role",
                        savedUser.getRole().getRoleName()
                ));
    }
}
