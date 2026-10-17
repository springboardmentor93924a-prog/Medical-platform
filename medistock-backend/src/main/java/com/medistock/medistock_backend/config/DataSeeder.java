package com.medistock.medistock_backend.config;

import com.medistock.medistock_backend.entity.Role;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.RoleRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import com.medistock.medistock_backend.util.RoleConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Runs once at startup in the dev profile.
 * Guarantees 4 roles exist. Creates one ADMIN user if none exists.
 *
 * Admin password source (in order of preference):
 *   1. SEED_ADMIN_PASSWORD env var (recommended)
 *   2. fall back to a fixed dev password with a loud warning
 */
@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${SEED_ADMIN_EMAIL:admin@medistock.local}")
    private String adminEmail;

    @Value("${SEED_ADMIN_PASSWORD:}")
    private String adminPassword;

    public DataSeeder(RoleRepository roleRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedAdmin();
    }

    private void seedRoles() {
        createRoleIfMissing(RoleConstants.ADMIN,      "System administrator");
        createRoleIfMissing(RoleConstants.PHARMACIST, "Manages medicine inventory");
        createRoleIfMissing(RoleConstants.STAFF,      "Day-to-day inventory operations");
        createRoleIfMissing(RoleConstants.SUPPLIER,   "External supplier account");
        log.info("Roles are present: ADMIN, PHARMACIST, STAFF, SUPPLIER");
    }

    private void createRoleIfMissing(String name, String desc) {
        roleRepository.findByName(name).orElseGet(() ->
                roleRepository.save(Role.builder().name(name).description(desc).build()));
    }

    private void seedAdmin() {
        if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
            log.info("Admin user already exists: {}", adminEmail);
            return;
        }

        String rawPassword;
        if (adminPassword == null || adminPassword.isBlank()) {
            rawPassword = "ChangeMe!123";
            log.warn("========================================================");
            log.warn(" No SEED_ADMIN_PASSWORD provided.");
            log.warn(" A default admin was created with password: {}", rawPassword);
            log.warn(" Change this immediately for any shared environment.");
            log.warn("========================================================");
        } else {
            rawPassword = adminPassword;
        }

        Role adminRole = roleRepository.findByName(RoleConstants.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role missing"));

        User admin = User.builder()
                .fullName("System Administrator")
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .phone(null)
                .enabled(true)
                .roles(Set.of(adminRole))
                .build();

        userRepository.save(admin);
        log.info("Seeded admin user: {}", adminEmail);
    }
}