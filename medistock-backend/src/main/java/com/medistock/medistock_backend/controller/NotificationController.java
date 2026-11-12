package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.NotificationResponse;
import com.medistock.medistock_backend.entity.Medicine;
import com.medistock.medistock_backend.entity.NotificationState;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.MedicineRepository;
import com.medistock.medistock_backend.repository.NotificationStateRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_PHARMACIST', 'PHARMACIST')")
public class NotificationController {

    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final NotificationStateRepository notificationStateRepository; // NEW

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAdminNotifications() {
        List<NotificationResponse> notifications = new ArrayList<>();
        List<Medicine> allMeds = medicineRepository.findAll();
        LocalDate today = LocalDate.now();

        // 1. Check for Expiring / Expired Medicines
        for (Medicine med : allMeds) {
            if (med.getExpiryDate() != null) {
                long daysUntilExpiry = ChronoUnit.DAYS.between(today, med.getExpiryDate());

                if (daysUntilExpiry < 0) {
                    String key = "exp-" + med.getId();
                    if (!notificationStateRepository.existsByNotificationKey(key)) {
                        notifications.add(new NotificationResponse(
                                key, "CRITICAL", "Expired Stock Alert",
                                med.getName() + " (Batch: " + med.getBatchNumber() + ") has expired. Quarantine immediately.", "Today"
                        ));
                    }
                } else if (daysUntilExpiry <= 45) {
                    String key = "exp-soon-" + med.getId();
                    if (!notificationStateRepository.existsByNotificationKey(key)) {
                        notifications.add(new NotificationResponse(
                                key, "WARNING", "Near-Expiry Warning",
                                med.getName() + " expires in " + daysUntilExpiry + " days.", "Today"
                        ));
                    }
                }
            }

            // 2. Check for Low Stock / Out of Stock
            if (med.getQuantity() == 0) {
                String key = "out-" + med.getId();
                if (!notificationStateRepository.existsByNotificationKey(key)) {
                    notifications.add(new NotificationResponse(
                            key, "CRITICAL", "Out of Stock",
                            med.getName() + " is completely out of stock.", "Today"
                    ));
                }
            } else if (med.getQuantity() <= med.getMinQuantity()) {
                String key = "low-" + med.getId();
                if (!notificationStateRepository.existsByNotificationKey(key)) {
                    notifications.add(new NotificationResponse(
                            key, "WARNING", "Low Stock Alert",
                            med.getName() + " is running low. Only " + med.getQuantity() + " units left.", "Today"
                    ));
                }
            }
        }

        // 3. Check for Recently Registered Users
        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (user.getCreatedAt() != null && user.getCreatedAt().isAfter(LocalDateTime.now().minusDays(1))) {
                String key = "usr-" + user.getId();
                if (!notificationStateRepository.existsByNotificationKey(key)) {
                    notifications.add(new NotificationResponse(
                            key, "INFO", "New User Registered",
                            user.getFullName() + " (" + user.getEmail() + ") recently joined the system.", "Recently"
                    ));
                }
            }
        }

        return ResponseEntity.ok(notifications);
    }

    // NEW ENDPOINT TO CLEAR A NOTIFICATION
    @DeleteMapping("/{id}")
    public ResponseEntity<String> clearNotification(@PathVariable String id) {
        if (!notificationStateRepository.existsByNotificationKey(id)) {
            notificationStateRepository.save(new NotificationState(id));
        }
        return ResponseEntity.ok("Notification cleared");
    }
}