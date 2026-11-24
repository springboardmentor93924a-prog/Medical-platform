package com.medistock.medistock.repository;

import com.medistock.medistock.entity.WastageRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WastageRecordRepository extends JpaRepository<WastageRecord, Integer> {

    List<WastageRecord> findByStatus(String status);

    List<WastageRecord> findByReportedByIdOrderByCreatedAtDesc(Integer reportedById);

    List<WastageRecord> findAllByOrderByCreatedAtDesc();

    List<WastageRecord> findByStatusInOrderByCreatedAtDesc(List<String> statuses);

    @Query("SELECT COUNT(w) FROM WastageRecord w WHERE w.status = 'PENDING_APPROVAL' OR w.status = 'VERIFIED'")
    long countPendingApprovals();

    @Query("SELECT COALESCE(SUM(w.quantity), 0) FROM WastageRecord w WHERE w.status = 'APPROVED' OR w.status = 'WRITTEN_OFF'")
    long sumApprovedWastedUnits();

    @Query("SELECT COALESCE(SUM(w.totalLoss), 0.0) FROM WastageRecord w WHERE w.status = 'APPROVED' OR w.status = 'WRITTEN_OFF'")
    BigDecimal sumTotalWastageCost();

    @Query("SELECT COALESCE(SUM(w.supplierRecovery), 0.0) FROM WastageRecord w WHERE w.status = 'APPROVED' OR w.status = 'WRITTEN_OFF'")
    BigDecimal sumSupplierRecovery();

    @Query("SELECT COALESCE(SUM(w.netFinancialLoss), 0.0) FROM WastageRecord w WHERE w.status = 'APPROVED' OR w.status = 'WRITTEN_OFF'")
    BigDecimal sumNetFinancialLoss();
}

