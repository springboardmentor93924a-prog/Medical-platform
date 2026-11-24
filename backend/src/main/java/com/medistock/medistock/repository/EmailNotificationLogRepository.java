package com.medistock.medistock.repository;

import com.medistock.medistock.entity.EmailNotificationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailNotificationLogRepository extends JpaRepository<EmailNotificationLog, Long>, JpaSpecificationExecutor<EmailNotificationLog> {

    List<EmailNotificationLog> findTop50ByOrderBySentAtDesc();

    Page<EmailNotificationLog> findByRecipientUserIdOrderBySentAtDesc(Integer userId, Pageable pageable);

    long countByDeliveryStatus(String deliveryStatus);

    @Query("SELECT l.notificationType, COUNT(l) FROM EmailNotificationLog l GROUP BY l.notificationType")
    List<Object[]> countGroupedByType();
}

