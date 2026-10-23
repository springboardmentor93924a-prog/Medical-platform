package com.medistock.medistock_backend.config;

import com.medistock.medistock_backend.entity.Role;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.RoleRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;

@Component
@Profile("dev") // Only runs in development profile
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Roles
        Arrays.asList("ADMIN", "PHARMACIST", "STAFF", "SUPPLIER").forEach(r -> {
            if (roleRepository.findByName(r).isEmpty()) {
                Role role = new Role();
                role.setName(r);
                roleRepository.save(role);
            }
        });

        // 2. Seed Admin User
        if (!userRepository.existsByEmail("admin@medistock.com")) {
            User admin = new User();
            admin.setFullName("System Admin");
            admin.setEmail("admin@medistock.com");
            admin.setPassword(passwordEncoder.encode("admin123")); // Default password
            admin.setPhone("1234567890");
            admin.setEnabled(true);

            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            admin.setRoles(Collections.singleton(adminRole));

            userRepository.save(admin);
            System.out.println(">>> SEEDED DEFAULT ADMIN: admin@medistock.com / admin123");
        }
    }
}