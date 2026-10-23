package com.medistock.repository;

import com.medistock.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:action = '' OR a.action = :action)
          AND (:q = '' OR LOWER(a.performedBy) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(a.summary) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(a.entityType) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY a.auditId DESC
    """)
    Page<AuditLog> search(@Param("action") String action,
                          @Param("q") String q,
                          Pageable pageable);
}
