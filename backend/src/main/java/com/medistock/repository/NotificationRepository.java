package com.medistock.repository;

import com.medistock.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByNotificationTypeAndMessageAndReadFalse(
            String notificationType, String message);

    long countByReadFalse();

    List<Notification> findTop50ByOrderByNotificationIdDesc();

    @Query("SELECT n FROM Notification n WHERE n.read = false ORDER BY n.notificationId DESC")
    List<Notification> findUnread();
}
