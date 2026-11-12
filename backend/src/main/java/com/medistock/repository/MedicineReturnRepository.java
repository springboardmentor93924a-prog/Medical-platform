
package com.medistock.repository;

import com.medistock.entity.MedicineReturn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicineReturnRepository
        extends JpaRepository<MedicineReturn, Long> {

    // All returns, newest first
    List<MedicineReturn> findAllByOrderByCreatedAtDesc();

    // Filter by return type
    List<MedicineReturn> findByReturnTypeOrderByCreatedAtDesc(
            String returnType
    );

    // Filter by status
    List<MedicineReturn> findByReturnStatusOrderByCreatedAtDesc(
            String returnStatus
    );

    // Returns belonging to a specific inventory batch
    List<MedicineReturn> findByInventoryIdOrderByCreatedAtDesc(
            Long inventoryId
    );

    // Returns created by a particular user
    List<MedicineReturn> findByCreatedByOrderByCreatedAtDesc(
            Long userId
    );

    // Supplier return history
    List<MedicineReturn> findBySupplierIdOrderByCreatedAtDesc(
            Long supplierId
    );

    // Filter by date range
    @Query("""
        SELECT r FROM MedicineReturn r
        WHERE r.returnDate BETWEEN :startDate AND :endDate
        ORDER BY r.createdAt DESC
    """)
    List<MedicineReturn> findByReturnDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Count pending returns
    long countByReturnStatus(String returnStatus);

    // Count returns by type
    long countByReturnType(String returnType);
}
