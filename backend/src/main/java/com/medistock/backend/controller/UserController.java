package com.medistock.backend.controller;

import com.medistock.backend.dto.UserDtos.*;
import com.medistock.backend.service.UserAdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserAdminService service;

    public UserController(UserAdminService service) { this.service = service; }

    @GetMapping
    public List<UserSummary> list() { return service.list(); }

    @PutMapping("/{id}")
    public UserSummary update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest r, Authentication auth) {
        return service.update(id, r, auth.getName());
    }
}
