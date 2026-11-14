package com.medistock.config;

import com.medistock.entity.User;
import com.medistock.enums.Role;
import com.medistock.enums.UserStatus;
import com.medistock.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${app.admin.bootstrap.email:admin@medistock.com}")
    private String adminEmail;

    @Value("${app.admin.bootstrap.password:Admin@MediStock2026!}")
    private String adminPassword;

    @Value("${app.admin.bootstrap.name:System Administrator}")
    private String adminName;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        long adminCount = userRepository.countByRole(Role.ADMIN);
        if (adminCount == 0 && bootstrapEnabled) {
            logger.info("No system administrator found in database. Initializing bootstrap admin account: {}", adminEmail);
            User admin = new User(
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    adminName,
                    "+10000000000",
                    "Headquarters Admin Office",
                    Role.ADMIN,
                    UserStatus.ACTIVE
            );
            userRepository.save(admin);
            logger.info("System administrator account provisioned successfully.");
        } else {
            logger.info("System administrator account(s) verified in database (count: {}).", adminCount);
        }
    }
}
