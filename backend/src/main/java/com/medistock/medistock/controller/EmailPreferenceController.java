package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.email.EmailPreferenceDto;
import com.medistock.medistock.dto.email.UpdateEmailPreferenceRequest;
import com.medistock.medistock.service.CurrentUserService;
import com.medistock.medistock.service.EmailPreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications/preferences")
public class EmailPreferenceController {

    private final EmailPreferenceService preferenceService;
    private final CurrentUserService currentUserService;

    public EmailPreferenceController(EmailPreferenceService preferenceService,
                                     CurrentUserService currentUserService) {
        this.preferenceService = preferenceService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmailPreferenceDto>>> getPreferences() {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }

        List<EmailPreferenceDto> list = preferenceService.getPreferencesForUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<List<EmailPreferenceDto>>> updatePreferences(
            @RequestBody UpdateEmailPreferenceRequest request) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }

        if (request == null || request.getPreferences() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Preferences map is required"));
        }

        List<EmailPreferenceDto> updated = preferenceService.updatePreferences(userId, request.getPreferences());
        return ResponseEntity.ok(ApiResponse.ok("Email preferences updated successfully", updated));
    }
}

