
package com.medistock.repository;

import com.medistock.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // Check whether a duplicate unread notification exists.
    boolean existsByUserIdAndNotificationTypeAndMessageAndReadFalse(
            Long userId,
            String notificationType,
            String message
    );

    // Count all unread notifications.
    long countByReadFalse();

    // Count unread notifications belonging to a user.
    long countByUserIdAndReadFalse(Long userId);

    // Get latest 50 notifications globally.
    List<Notification> findTop50ByOrderByNotificationIdDesc();

    // Get all notifications visible to a user (personal + shared).
    @Query("""
        SELECT n FROM Notification n
        WHERE n.userId = :userId OR n.userId IS NULL
        ORDER BY n.notificationId DESC
    """)
    List<Notification> findVisibleToUser(
            @Param("userId") Long userId
    );

    // Get latest 50 notifications visible to a user.
    @Query("""
        SELECT n FROM Notification n
        WHERE n.userId = :userId OR n.userId IS NULL
        ORDER BY n.notificationId DESC
    """)
    List<Notification> findRecentVisibleToUser(
            @Param("userId") Long userId,
            Pageable pageable
    );

    // Get unread notifications visible to a user.
    @Query("""
        SELECT n FROM Notification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
        AND n.read = false
        ORDER BY n.notificationId DESC
    """)
    List<Notification> findUnreadVisibleToUser(
            @Param("userId") Long userId
    );

    // Get read notifications visible to a user.
    @Query("""
        SELECT n FROM Notification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
        AND n.read = true
        ORDER BY n.notificationId DESC
    """)
    List<Notification> findReadVisibleToUser(
            @Param("userId") Long userId
    );

    // Count unread notifications visible to a user.
    @Query("""
        SELECT COUNT(n) FROM Notification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
        AND n.read = false
    """)
    long countUnreadVisibleToUser(
            @Param("userId") Long userId
    );

    // Get notifications by type (personal + shared).
    @Query("""
        SELECT n FROM Notification n
        WHERE (n.userId = :userId OR n.userId IS NULL)
        AND n.notificationType = :type
        ORDER BY n.notificationId DESC
    """)
    List<Notification> findByTypeVisibleToUser(
            @Param("userId") Long userId,
            @Param("type") String type
    );

    // Get all unread notifications globally.
    @Query("""
        SELECT n FROM Notification n
        WHERE n.read = false
        ORDER BY n.notificationId DESC
    """)
    List<Notification> findUnread();

    // Get notifications belonging only to a particular user.
    List<Notification> findByUserIdOrderByNotificationIdDesc(
            Long userId
    );

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
}
