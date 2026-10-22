
package com.medistock.repository;

import com.medistock.entity.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    List<StockLog> findAllByOrderByChangedAtDesc();
    List<StockLog> findByInventoryIdOrderByChangedAtDesc(Long inventoryId);
}
