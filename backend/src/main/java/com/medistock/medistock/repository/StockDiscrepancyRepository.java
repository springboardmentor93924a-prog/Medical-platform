package com.medistock.medistock.repository;

import com.medistock.medistock.entity.StockDiscrepancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockDiscrepancyRepository extends JpaRepository<StockDiscrepancy, Integer> {
    List<StockDiscrepancy> findAllByOrderByCreatedAtDesc();
    List<StockDiscrepancy> findByStatusOrderByCreatedAtDesc(String status);
    List<StockDiscrepancy> findByReportedByOrderByCreatedAtDesc(Integer reportedBy);
}

