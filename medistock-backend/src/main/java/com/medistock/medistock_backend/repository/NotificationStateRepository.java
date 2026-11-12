package com.medistock.medistock_backend.repository;

import com.medistock.medistock_backend.entity.NotificationState;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationStateRepository extends JpaRepository<NotificationState, Long> {
    boolean existsByNotificationKey(String notificationKey);
    // We will need this to filter out dismissed notifications
    List<NotificationState> findAll();
}