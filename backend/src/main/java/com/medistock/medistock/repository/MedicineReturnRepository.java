package com.medistock.medistock.repository;

import com.medistock.medistock.entity.MedicineReturn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineReturnRepository extends JpaRepository<MedicineReturn, Integer>, JpaSpecificationExecutor<MedicineReturn> {

    Optional<MedicineReturn> findByReturnNumber(String returnNumber);

    List<MedicineReturn> findByRequestedBy_UserIdOrderByCreatedAtDesc(Integer userId);

    List<MedicineReturn> findBySupplier_SupplierIdOrderByCreatedAtDesc(Integer supplierId);

    List<MedicineReturn> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT COUNT(r) FROM MedicineReturn r WHERE r.status IN ('QUARANTINED', 'UNDER_INSPECTION')")
    long countQuarantinedOrUnderInspection();

    @Query("SELECT r.status, COUNT(r) FROM MedicineReturn r GROUP BY r.status")
    List<Object[]> countGroupedByStatus();

    @Query("SELECT r.returnReason, COUNT(r) FROM MedicineReturn r GROUP BY r.returnReason")
    List<Object[]> countGroupedByReason();
}

