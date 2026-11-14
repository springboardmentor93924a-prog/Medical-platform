package com.medistock.repository;

import com.medistock.entity.Notification;
import com.medistock.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId OR (n.recipient IS NULL AND n.targetRole = :role) ORDER BY n.createdAt DESC")
    Page<Notification> findForUser(@Param("userId") Long userId, @Param("role") Role role, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE (n.recipient.id = :userId OR (n.recipient IS NULL AND n.targetRole = :role)) AND (:unreadOnly IS NULL OR :unreadOnly = false OR n.isRead = false) ORDER BY n.createdAt DESC")
    Page<Notification> findForUser(@Param("userId") Long userId, @Param("role") Role role, @Param("unreadOnly") Boolean unreadOnly, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.recipient.id = :userId OR (n.recipient IS NULL AND n.targetRole = :role)) AND n.isRead = false")
    long countUnreadForUser(@Param("userId") Long userId, @Param("role") Role role);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.id = :userId OR (n.recipient IS NULL AND n.targetRole = :role)")
    void markAllAsReadForUser(@Param("userId") Long userId, @Param("role") Role role);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :recipientId OR (n.recipient IS NULL AND n.targetRole = :targetRole) ORDER BY n.createdAt DESC")
    List<Notification> findTop10ByRecipientIdOrTargetRoleOrderByCreatedAtDesc(@Param("recipientId") Long recipientId, @Param("targetRole") Role targetRole);
}
