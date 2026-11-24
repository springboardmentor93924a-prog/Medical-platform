package com.medistock.medistock.repository;

import com.medistock.medistock.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Integer> {
    List<StockAdjustment> findAllByOrderByAdjustmentDateDesc();
    List<StockAdjustment> findByBatchIdOrderByAdjustmentDateDesc(Integer batchId);
}
