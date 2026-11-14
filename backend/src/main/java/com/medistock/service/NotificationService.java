package com.medistock.service;

import com.medistock.entity.Notification;
import com.medistock.entity.User;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    Notification sendNotification(User recipient, Role targetRole, String title, String message, NotificationType type);
    Notification sendNotification(User recipient, Role targetRole, String title, String message, NotificationType type, String navigationUrl);
    void notifyRole(Role targetRole, String title, String message, NotificationType type);
    void notifyRole(Role targetRole, String title, String message, NotificationType type, String navigationUrl);
    Page<Notification> getNotificationsForUser(String userEmail, Pageable pageable);
    Page<Notification> getNotificationsForUser(String userEmail, Boolean unreadOnly, Pageable pageable);
    long getUnreadCount(String userEmail);
    void markAsRead(Long id, String userEmail);
    void markAllAsRead(String userEmail);
    void markAllAsRead(Long userId);
    void deleteNotification(Long id, String userEmail);
}
