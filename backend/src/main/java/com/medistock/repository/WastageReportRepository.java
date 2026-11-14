package com.medistock.repository;

import com.medistock.entity.WastageReport;
import com.medistock.enums.WastageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WastageReportRepository extends JpaRepository<WastageReport, Long> {

    Page<WastageReport> findByStatus(WastageStatus status, Pageable pageable);

    @Query("SELECT w FROM WastageReport w WHERE w.reportedBy.id = :reportedById ORDER BY w.createdAt DESC")
    Page<WastageReport> findByReportedById(@Param("reportedById") Long reportedById, Pageable pageable);

    @Query("SELECT w FROM WastageReport w WHERE " +
           "(:status IS NULL OR w.status = :status) AND " +
           "(:medicineId IS NULL OR w.medicine.id = :medicineId)")
    Page<WastageReport> filterReports(@Param("status") WastageStatus status,
                                      @Param("medicineId") Long medicineId,
                                      Pageable pageable);

    @Query("SELECT COALESCE(SUM(w.totalLoss), 0) FROM WastageReport w WHERE w.status = 'APPROVED'")
    BigDecimal calculateTotalApprovedLoss();

    @Query("SELECT COALESCE(SUM(w.quantityWasted), 0) FROM WastageReport w WHERE w.status = 'APPROVED'")
    Long calculateTotalApprovedQuantity();

    long countByStatus(WastageStatus status);
}
