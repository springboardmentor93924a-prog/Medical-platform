
package com.medistock.controller;

import com.medistock.entity.User;
import com.medistock.service.NotificationService;
import com.medistock.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import com.medistock.entity.Notification;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository) {

        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    // Get latest 50 notifications for logged-in user
    @GetMapping
    public List<Notification> getNotifications(
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        return notificationService.getRecent(userId);
    }

    // Get unread notifications
    @GetMapping("/unread")
    public List<Notification> getUnreadNotifications(
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        return notificationService.getUnread(userId);
    }

    // Get read notifications
    @GetMapping("/read")
    public List<Notification> getReadNotifications(
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        return notificationService.getRead(userId);
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        return Map.of(
                "count",
                notificationService.unreadCount(userId)
        );
    }

    // Refresh low-stock, expiry and pending-order alerts
    // Admin and Pharmacist only
    @PostMapping("/refresh")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public Map<String, Object> refreshNotifications() {

        int created = notificationService.refresh();

        return Map.of(
                "created", created,
                "message", "Notifications refreshed successfully"
        );
    }

    // Mark one notification as read
    @PostMapping("/{id}/read")
    public Map<String, String> markNotificationAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        boolean updated =
                notificationService.markRead(id, userId);

        if (!updated) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Notification not found"
            );
        }

        return Map.of(
                "message",
                "Notification marked as read"
        );
    }

    // Mark all visible notifications as read
    @PostMapping("/read-all")
    public Map<String, Object> markAllNotificationsAsRead(
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        int updated =
                notificationService.markAllRead(userId);

        return Map.of(
                "updated",
                updated,
                "message",
                "Notifications marked as read"
        );
    }

    // Delete one notification
    @DeleteMapping("/{id}")
    public Map<String, String> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        boolean deleted =
                notificationService.deleteNotification(id, userId);

        if (!deleted) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Notification not found"
            );
        }

        return Map.of(
                "message",
                "Notification deleted successfully"
        );
    }

    // Clear all visible notifications
    // Admin and Pharmacist only
    @DeleteMapping("/clear-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public Map<String, String> clearAllNotifications(
            Authentication authentication) {

        Long userId = getCurrentUserId(authentication);

        notificationService.clearAll(userId);

        return Map.of(
                "message",
                "All notifications cleared successfully"
        );
    }

    // Get logged-in user's database ID using authenticated email
    private Long getCurrentUserId(Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found"
                ));

        return user.getUserId();
    }
}
