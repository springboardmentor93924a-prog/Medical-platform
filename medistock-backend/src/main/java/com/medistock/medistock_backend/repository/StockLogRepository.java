// StockLogRepository.java
package com.medistock.medistock_backend.repository;
import com.medistock.medistock_backend.entity.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    List<StockLog> findByMedicineIdOrderByTimestampDesc(Long medicineId);
}