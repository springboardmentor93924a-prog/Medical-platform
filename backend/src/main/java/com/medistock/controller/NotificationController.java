package com.medistock.controller;

import com.medistock.entity.Notification;
import com.medistock.service.NotificationService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public List<Notification> getNotifications() {
        return notificationService.getRecent();
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notificationService.unreadCount());
    }

    @PostMapping("/refresh")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public Map<String, Object> refresh() {
        int created = notificationService.refresh();
        return Map.of(
                "created", created,
                "unread", notificationService.unreadCount());
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public Map<String, String> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return Map.of("message", "Marked as read");
    }

    @PostMapping("/read-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public Map<String, Object> markAllRead() {
        int updated = notificationService.markAllRead();
        return Map.of("updated", updated);
    }
}
