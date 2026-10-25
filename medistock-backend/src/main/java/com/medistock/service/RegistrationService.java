package com.medistock.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medistock.dto.auth.RegisterRequest;
import com.medistock.entity.AuthProvider;
import com.medistock.entity.Role;
import com.medistock.entity.User;
import com.medistock.repository.RoleRepository;
import com.medistock.repository.UserRepository;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String roleName = request.role().trim().toUpperCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        if (!roleName.equals("ADMIN")
        && !roleName.equals("STAFF")
        && !roleName.equals("PHARMACIST")
        && !roleName.equals("SUPPLIER")) {
    throw new IllegalArgumentException("Invalid registration role.");
}
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() ->
                        new IllegalArgumentException("The selected role does not exist."));

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone().trim());
        user.setRole(role);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setActive(true);

        userRepository.save(user);
    }
}
