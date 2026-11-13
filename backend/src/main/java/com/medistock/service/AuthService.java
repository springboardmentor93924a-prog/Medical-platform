
package com.medistock.service;

import com.medistock.dto.RegisterRequest;
import com.medistock.dto.LoginRequest;
import com.medistock.dto.LoginResponse;

import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.entity.Supplier;


import com.medistock.repository.SupplierRepository;
import com.medistock.repository.RoleRepository;
import com.medistock.repository.UserRepository;
import com.medistock.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final SupplierRepository supplierRepository;



        private static final Logger logger =
        LoggerFactory.getLogger(AuthService.class);

private final EmailService emailService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        SupplierRepository supplierRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AuditService auditService,
        EmailService emailService) {

    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.supplierRepository = supplierRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.auditService = auditService;
      this.emailService = emailService;
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

       return new LoginResponse(
        token,
        "Bearer",
        jwtService.getExpirationSeconds(),
        roleName,
        user.getProfilePicture(),
        user.getFullName()
);
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

    String requestedRole = request.getRole();


    

    if (requestedRole == null
            || (!requestedRole.equalsIgnoreCase("STAFF")
            && !requestedRole.equalsIgnoreCase("PHARMACIST")
            && !requestedRole.equalsIgnoreCase("SUPPLIER"))) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid role. Choose STAFF, PHARMACIST, or SUPPLIER");
    }

    Role role = roleRepository.findByRoleName(
            requestedRole.trim().toUpperCase())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected role not found in database"));

    // Create login account
    User user = new User();
    user.setFullName(request.getFullName().trim());
    user.setEmail(email);
    user.setPasswordHash(
            passwordEncoder.encode(request.getPassword()));
    user.setRole(role);
    user.setActive(true);

    userRepository.save(user);

    // Create supplier profile automatically
    if ("SUPPLIER".equalsIgnoreCase(role.getRoleName())) {

    Supplier supplier = supplierRepository
            .findByEmailIgnoreCase(email)
            .orElseGet(Supplier::new);

    supplier.setSupplierName(request.getFullName().trim());
    supplier.setEmail(email);
    supplier.setActive(true);

    supplierRepository.save(supplier);
}

    auditService.record(
        "REGISTER",
        "USER",
        user.getUserId(),
        "Self-registered with role " + role.getRoleName(),
        email
);

// Send welcome email
try {
    String subject = "Welcome to MediStock!";

    String message =
            "Hello " + user.getFullName() + ",\n\n"
            + "Welcome to MediStock!\n\n"
            + "Your account has been successfully created.\n"
            + "Account email: " + user.getEmail() + "\n"
            + "Your role: " + role.getRoleName() + "\n\n"
            + "You can now log in and start using MediStock.\n\n"
            + "Thank you for joining us!\n"
            + "MediStock Team";

    emailService.sendTextEmail(email, subject, message);

    logger.info("Welcome email sent to {}", email);

} catch (Exception exception) {
    logger.error(
            "Registration succeeded, but welcome email failed for {}",
            email,
            exception
    );
}

return "Registration successful";
}
}
