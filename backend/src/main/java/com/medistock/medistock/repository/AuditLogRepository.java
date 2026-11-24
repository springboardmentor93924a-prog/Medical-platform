package com.medistock.medistock.repository;

import com.medistock.medistock.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer>, JpaSpecificationExecutor<AuditLog> {

    Optional<AuditLog> findByEventId(String eventId);

    List<AuditLog> findAllByOrderByCreatedAtDesc();

    List<AuditLog> findTop25ByOrderByCreatedAtDesc();

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Integer entityId);

    // Get latest record for hash-chain continuity
    Optional<AuditLog> findTopByOrderByAuditLogIdDesc();

    // Full sequential chain for tamper-evident cryptographic verification
    List<AuditLog> findAllByOrderByAuditLogIdAsc();

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM AuditLog a WHERE a.userId IS NOT NULL")
    long countDistinctActiveUsers();

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.createdAt >= :since")
    long countRecentActivities(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action = 'LOGIN_FAILED' AND a.ipAddress = :ipAddress AND a.createdAt >= :since")
    long countRecentFailedLoginsByIp(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action = 'LOGIN_FAILED' AND a.reason LIKE %:email% AND a.createdAt >= :since")
    long countRecentFailedLoginsByEmail(@Param("email") String email, @Param("since") LocalDateTime since);
}
