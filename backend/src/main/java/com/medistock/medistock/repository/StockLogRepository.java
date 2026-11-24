package com.medistock.medistock.repository;

import com.medistock.medistock.entity.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StockLogRepository extends JpaRepository<StockLog, Integer> {

    List<StockLog> findAllByOrderByCreatedAtDesc();

    List<StockLog> findTop15ByOrderByCreatedAtDesc();

    List<StockLog> findByTransactionTypeOrderByCreatedAtDesc(String transactionType);

    List<StockLog> findByBatchIdOrderByCreatedAtDesc(Integer batchId);

    @Query("SELECT sl FROM StockLog sl JOIN sl.batch b " +
           "WHERE sl.transactionType = 'DISPENSED' AND sl.createdAt >= :since " +
           "ORDER BY sl.createdAt ASC")
    List<StockLog> findDispensedLogsSince(@Param("since") LocalDateTime since);

    @Query("SELECT sl FROM StockLog sl JOIN sl.batch b " +
           "WHERE b.medicineId = :medicineId AND sl.transactionType = 'DISPENSED' AND sl.createdAt >= :since " +
           "ORDER BY sl.createdAt ASC")
    List<StockLog> findDispensedLogsForMedicineSince(@Param("medicineId") Integer medicineId, @Param("since") LocalDateTime since);

    @Query("SELECT sl FROM StockLog sl JOIN sl.batch b WHERE b.medicineId = :medicineId ORDER BY sl.createdAt DESC")
    List<StockLog> findAllLogsForMedicine(@Param("medicineId") Integer medicineId);
}
