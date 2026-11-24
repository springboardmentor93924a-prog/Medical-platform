package com.medistock.medistock.repository;

import com.medistock.medistock.entity.FefoAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FefoAllocationRepository extends JpaRepository<FefoAllocation, Integer> {

    List<FefoAllocation> findAllByOrderByCreatedAtDesc();

    List<FefoAllocation> findTop100ByOrderByCreatedAtDesc();

    List<FefoAllocation> findByMedicineIdOrderByCreatedAtDesc(Integer medicineId);

    List<FefoAllocation> findByBatchIdOrderByCreatedAtDesc(Integer batchId);

    List<FefoAllocation> findByIsFefoCompliantOrderByCreatedAtDesc(Boolean isFefoCompliant);

    long countByIsFefoCompliant(Boolean isFefoCompliant);

    @Query("SELECT COALESCE(SUM(a.allocatedQuantity), 0) FROM FefoAllocation a")
    Long sumTotalAllocatedQuantity();

    @Query("SELECT COALESCE(SUM(a.allocatedQuantity), 0) FROM FefoAllocation a WHERE a.isFefoCompliant = true")
    Long sumCompliantAllocatedQuantity();

    @Query("SELECT a FROM FefoAllocation a WHERE a.createdAt >= :since ORDER BY a.createdAt DESC")
    List<FefoAllocation> findRecentAllocations(@Param("since") LocalDateTime since);

    @Query("SELECT a.overrideReason, COUNT(a) FROM FefoAllocation a WHERE a.isFefoCompliant = false AND a.overrideReason IS NOT NULL GROUP BY a.overrideReason")
    List<Object[]> countOverridesByReason();
}

