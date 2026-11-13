package com.medistock.backend.controller;

import com.medistock.backend.dto.AuthDtos.MessageResponse;
import com.medistock.backend.dto.AuthDtos.UserResponse;
import com.medistock.backend.dto.ProfileDtos.*;
import com.medistock.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService service;

    public ProfileController(ProfileService service) { this.service = service; }

    @PutMapping
    public UserResponse update(@Valid @RequestBody ProfileUpdateRequest r, Authentication auth) {
        return service.update(auth.getName(), r);
    }

    @PostMapping("/password")
    public MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest r, Authentication auth) {
        service.changePassword(auth.getName(), r);
        return new MessageResponse("Password changed.");
    }
}
