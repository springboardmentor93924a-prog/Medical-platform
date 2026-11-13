package com.medistock.backend.controller;

import com.medistock.backend.dto.AuthDtos.MessageResponse;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.UserRepository;
import com.medistock.backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class NotificationTestController {
    private final NotificationService notifications;
    private final UserRepository users;

    public NotificationTestController(NotificationService notifications, UserRepository users) {
        this.notifications = notifications; this.users = users;
    }

    @PostMapping("/test")
    public MessageResponse test(Authentication auth) {
        var u = users.findByUsernameIgnoreCase(auth.getName()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
        return new MessageResponse(notifications.sendTest(u));
    }
}
