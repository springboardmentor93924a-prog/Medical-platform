
package com.medistock.repository;

import com.medistock.entity.SystemMonitoring;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemMonitoringRepository
        extends JpaRepository<SystemMonitoring, Long> {

    @Query("""
        SELECT s FROM SystemMonitoring s
        WHERE (:action = '' OR s.action = :action)
          AND (:q = '' OR
               LOWER(s.performedBy) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(s.summary) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(s.entityType) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY s.auditId DESC
    """)
    Page<SystemMonitoring> search(
            @Param("action") String action,
            @Param("q") String q,
            Pageable pageable
    );
}
