package com.medistock.backend.service;

import com.medistock.backend.entity.Role;
import com.medistock.backend.entity.User;
import com.medistock.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Admins cannot self-register. This creates the first one at startup if app.admin.* is set. */
@Component
public class AdminSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String username, email, password;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder,
                       @Value("${app.admin.username:}") String username,
                       @Value("${app.admin.email:}") String email,
                       @Value("${app.admin.password:}") String password) {
        this.users = users; this.encoder = encoder;
        this.username = username; this.email = email; this.password = password;
    }

    @Override
    public void run(String... args) {
        if (username.isBlank() || password.isBlank() || users.existsByUsernameIgnoreCase(username)) return;
        User u = new User();
        u.setUsername(username);
        u.setEmail(email.toLowerCase());
        u.setPasswordHash(encoder.encode(password));
        u.setFullName("System Admin");
        u.setPhone("0000000000");
        u.setRole(Role.ADMIN);
        users.save(u);
        log.info("Created initial admin user '{}'", username);
    }
}
