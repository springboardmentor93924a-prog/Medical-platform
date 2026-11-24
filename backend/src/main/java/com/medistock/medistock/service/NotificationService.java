package com.medistock.medistock.service;

import com.medistock.medistock.entity.Notification;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.NotificationRepository;
import com.medistock.medistock.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RealtimeEventService realtimeEventService;
    private final EmailNotificationService emailNotificationService;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               RealtimeEventService realtimeEventService,
                               EmailNotificationService emailNotificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.realtimeEventService = realtimeEventService;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public Notification sendNotification(Integer userId, String title, String message,
                                         String notificationType, String entityType, Integer entityId, String priority) {
        // Prevent duplicate unread notifications for identical business event
        if (entityType != null && entityId != null) {
            boolean duplicate = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                    .anyMatch(n -> !Boolean.TRUE.equals(n.getRead()) &&
                            notificationType.equals(n.getNotificationType()) &&
                            entityType.equals(n.getRelatedEntityType()) &&
                            entityId.equals(n.getRelatedEntityId()));
            if (duplicate) {
                return null;
            }
        }

        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setNotificationType(notificationType);
        notif.setRelatedEntityType(entityType);
        notif.setRelatedEntityId(entityId);
        notif.setPriority(priority != null ? priority : "NORMAL");
        notif.setRead(false);

        Notification saved = notificationRepository.save(notif);

        User recipient = userRepository.findById(userId).orElse(null);
        String email = recipient != null ? recipient.getEmail() : null;
        realtimeEventService.publishNotification(userId, email, saved);

        // Bridge to SMTP Email Notification System asynchronously
        try {
            if (email != null && !email.isBlank()) {
                Map<String, Object> data = new HashMap<>();
                data.put("message", message);
                data.put("notificationType", notificationType);
                data.put("entityType", entityType);
                data.put("entityId", entityId);

                String template = "GENERAL";
                if ("PURCHASE_ORDER".equalsIgnoreCase(entityType) || (notificationType != null && notificationType.contains("PO_"))) {
                    template = "PURCHASE_ORDER";
                } else if ("BATCH".equalsIgnoreCase(entityType) || (notificationType != null && (notificationType.contains("STOCK") || notificationType.contains("EXPIR")))) {
                    template = notificationType.contains("EXPIR") ? "EXPIRY_FEFO" : "INVENTORY_ALERT";
                } else if ("FEEDBACK".equalsIgnoreCase(entityType)) {
                    template = "FEEDBACK_UPDATE";
                } else if ("TASK".equalsIgnoreCase(entityType)) {
                    template = "TASK_ASSIGNMENT";
                }

                String idempotencyKey = "NOTIF-" + saved.getNotificationId() + "-" + (notificationType != null ? notificationType : "GENERAL");

                emailNotificationService.sendEmail(
                        notificationType != null ? notificationType : "SYSTEM_NOTIFICATION",
                        userId,
                        email,
                        recipient.getFullName(),
                        title,
                        template,
                        data,
                        priority,
                        idempotencyKey,
                        false
                );
            }
        } catch (Exception ex) {
            // Failure in email preparation must NEVER roll back the notification or business transaction
        }

        return saved;
    }

    @Transactional
    public Notification sendNotification(Integer userId, String title, String message,
                                         String notificationType, String entityType, Integer entityId) {
        return sendNotification(userId, title, message, notificationType, entityType, entityId, "NORMAL");
    }

    @Transactional
    public void notifyAdmins(String title, String message, String notificationType,
                             String entityType, Integer entityId) {
        notifyAdmins(title, message, notificationType, entityType, entityId, "NORMAL");
    }

    @Transactional
    public void notifyAdmins(String title, String message, String notificationType,
                             String entityType, Integer entityId, String priority) {
        List<User> admins = userRepository.findByRoleId(1);
        for (User admin : admins) {
            sendNotification(admin.getUserId(), title, message, notificationType, entityType, entityId, priority);
        }
    }

    @Transactional
    public void notifyRole(Integer roleId, String title, String message, String notificationType,
                           String entityType, Integer entityId) {
        notifyRole(roleId, title, message, notificationType, entityType, entityId, "NORMAL");
    }

    @Transactional
    public void notifyRole(Integer roleId, String title, String message, String notificationType,
                           String entityType, Integer entityId, String priority) {
        List<User> users = userRepository.findByRoleId(roleId);
        for (User user : users) {
            sendNotification(user.getUserId(), title, message, notificationType, entityType, entityId, priority);
        }
    }
}
