package com.medistock.medistock.repository;

import com.medistock.medistock.entity.EmailOutbox;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, Long>, JpaSpecificationExecutor<EmailOutbox> {

    Optional<EmailOutbox> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query("SELECT o FROM EmailOutbox o WHERE o.status = 'PENDING' OR (o.status = 'FAILED' AND o.attempts < o.maxAttempts AND (o.nextRetryAt IS NULL OR o.nextRetryAt <= :now)) ORDER BY o.priority DESC, o.createdAt ASC")
    List<EmailOutbox> findPendingOrEligibleForRetry(@Param("now") LocalDateTime now, Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COUNT(o) FROM EmailOutbox o WHERE o.status = 'PENDING' OR (o.status = 'FAILED' AND o.attempts < o.maxAttempts)")
    long countPendingQueue();

    @Query("SELECT o.eventType, COUNT(o) FROM EmailOutbox o GROUP BY o.eventType")
    List<Object[]> countGroupedByEventType();
}

