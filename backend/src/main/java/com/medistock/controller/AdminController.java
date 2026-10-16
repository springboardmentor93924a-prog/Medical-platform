
package com.medistock.controller;

import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> Map.<String, Object>of(
                        "fullName", user.getFullName(),
                        "email", user.getEmail(),
                        "role", user.getRole().getRoleName(),
                        "active", user.getActive()
                ))
                .toList();
    }
}
