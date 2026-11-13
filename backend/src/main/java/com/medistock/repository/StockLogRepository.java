
package com.medistock.repository;

import com.medistock.entity.StockLog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockLogRepository
        extends JpaRepository<StockLog, Long> {

    // Existing: all stock movements, newest first
    List<StockLog> findAllByOrderByChangedAtDesc();

    // Existing: stock movements for a particular inventory batch
    List<StockLog> findByInventoryIdOrderByChangedAtDesc(
            Long inventoryId
    );

    // AI: retrieve outgoing stock movements since a given date
    @Query("""
        SELECT s FROM StockLog s
        WHERE UPPER(s.movementType) = 'OUT'
        AND s.changedAt >= :startDate
        ORDER BY s.changedAt ASC
    """)
    List<StockLog> findOutgoingMovementsSince(
            @Param("startDate") LocalDateTime startDate
    );
}
