package com.medistock.medistock.repository;

import com.medistock.medistock.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    long countByIsReadFalse();
    List<Notification> findTop10ByOrderByCreatedAtDesc();

    @Query("""
            SELECT notification FROM Notification notification
            JOIN FETCH notification.user
            LEFT JOIN FETCH notification.batch batch
            LEFT JOIN FETCH batch.medicine
            LEFT JOIN FETCH batch.supplier
            ORDER BY notification.createdAt DESC, notification.notificationId DESC
            """)
    List<Notification> findAllWithDetails();

    @Modifying
    @Transactional
    @Query("UPDATE Notification notification SET notification.isRead = true WHERE notification.isRead = false")
    int markAllAsRead();
}
