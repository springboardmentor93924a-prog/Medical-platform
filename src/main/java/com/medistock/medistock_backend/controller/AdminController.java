package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.AuthResponse;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    // 1. Get All Users (Only accessible by ADMIN)
    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<List<AuthResponse.UserDto>> getAllUsers() {
        List<AuthResponse.UserDto> users = userRepository.findAll()
                .stream()
                .map(AuthResponse.UserDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // 2. Toggle User Status (Enable/Disable) (Only accessible by ADMIN)
    @PutMapping("/users/{id}/toggle-status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<String> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEnabled(!user.isEnabled());
        userRepository.save(user);

        return ResponseEntity.ok("User status updated to: " + (user.isEnabled() ? "Enabled" : "Disabled"));
    }
}