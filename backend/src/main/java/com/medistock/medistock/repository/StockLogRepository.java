package com.medistock.medistock.repository;

import com.medistock.medistock.entity.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockLogRepository extends JpaRepository<StockLog, Integer> {

    @Query("""
            SELECT movement FROM StockLog movement
            JOIN FETCH movement.batch batch
            JOIN FETCH batch.medicine medicine
            JOIN FETCH movement.user actor
            ORDER BY movement.dateTime DESC, movement.stockLogId DESC
            """)
    List<StockLog> findAllWithMovementDetails();
}
