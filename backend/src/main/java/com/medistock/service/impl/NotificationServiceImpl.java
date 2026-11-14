package com.medistock.service.impl;

import com.medistock.entity.Notification;
import com.medistock.entity.User;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.enums.UserStatus;
import com.medistock.exception.ForbiddenException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.NotificationRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Notification sendNotification(User recipient, Role targetRole, String title, String message, NotificationType type) {
        return sendNotification(recipient, targetRole, title, message, type, null);
    }

    @Override
    @Transactional
    public Notification sendNotification(User recipient, Role targetRole, String title, String message, NotificationType type, String navigationUrl) {
        if (recipient == null && targetRole != null) {
            notifyRole(targetRole, title, message, type, navigationUrl);
            return null;
        }
        Notification notification = new Notification(recipient, targetRole, title, message, type, navigationUrl);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void notifyRole(Role targetRole, String title, String message, NotificationType type) {
        notifyRole(targetRole, title, message, type, null);
    }

    @Override
    @Transactional
    public void notifyRole(Role targetRole, String title, String message, NotificationType type, String navigationUrl) {
        List<User> activeUsers = userRepository.findAllByRoleAndStatus(targetRole, UserStatus.ACTIVE);
        for (User user : activeUsers) {
            Notification notification = new Notification(user, targetRole, title, message, type, navigationUrl);
            notificationRepository.save(notification);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getNotificationsForUser(String userEmail, Pageable pageable) {
        return getNotificationsForUser(userEmail, false, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> getNotificationsForUser(String userEmail, Boolean unreadOnly, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        return notificationRepository.findForUser(user.getId(), user.getRole(), unreadOnly, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        return notificationRepository.countUnreadForUser(user.getId(), user.getRole());
    }

    @Override
    @Transactional
    public void markAsRead(Long id, String userEmail) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        boolean isRecipient = notification.getRecipient() != null && notification.getRecipient().getId().equals(user.getId());
        boolean isRoleTarget = notification.getTargetRole() != null && notification.getTargetRole() == user.getRole();

        if (!isRecipient && !isRoleTarget) {
            throw new ForbiddenException("Notification does not belong to the requesting user");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        notificationRepository.markAllAsReadForUser(user.getId(), user.getRole());
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        notificationRepository.markAllAsReadForUser(user.getId(), user.getRole());
    }

    @Override
    @Transactional
    public void deleteNotification(Long id, String userEmail) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        boolean isRecipient = notification.getRecipient() != null && notification.getRecipient().getId().equals(user.getId());
        boolean isRoleTarget = notification.getTargetRole() != null && notification.getTargetRole() == user.getRole();

        if (!isRecipient && !isRoleTarget) {
            throw new ForbiddenException("Notification does not belong to the requesting user");
        }

        notificationRepository.delete(notification);
    }
}
