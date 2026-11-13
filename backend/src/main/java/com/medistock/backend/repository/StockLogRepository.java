package com.medistock.backend.repository;

import com.medistock.backend.entity.StockLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    List<StockLog> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
    List<StockLog> findByBatchIdOrderByCreatedAtDescIdDesc(Long batchId, Pageable pageable);
}
