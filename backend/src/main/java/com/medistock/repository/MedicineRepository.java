package com.medistock.repository;

import com.medistock.entity.Medicine;
import com.medistock.enums.MedicineStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    Optional<Medicine> findByBatchNumber(String batchNumber);
    boolean existsByBatchNumber(String batchNumber);
    boolean existsByBatchNumberAndIdNot(String batchNumber, Long id);

    long countByStatus(MedicineStatus status);

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.quantity <= m.minimumStockLevel AND m.quantity > 0 AND m.status = :status")
    long countLowStock(@Param("status") MedicineStatus status);

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.quantity = 0 AND m.status = :status")
    long countOutOfStock(@Param("status") MedicineStatus status);

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.expiryDate < :today AND m.status = :status")
    long countExpired(@Param("today") LocalDate today, @Param("status") MedicineStatus status);

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.expiryDate >= :today AND m.expiryDate <= :warningDate AND m.status = :status")
    long countNearExpiry(@Param("today") LocalDate today, @Param("warningDate") LocalDate warningDate, @Param("status") MedicineStatus status);

    @Query("SELECT COALESCE(SUM(m.quantity), 0) FROM Medicine m WHERE m.status = :status")
    long sumTotalStock(@Param("status") MedicineStatus status);

    @Query("SELECT COUNT(m) > 0 FROM Medicine m WHERE m.category.id = :categoryId")
    boolean existsByCategory_Id(@Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.category.id = :categoryId")
    long countByCategory_Id(@Param("categoryId") Long categoryId);

    @Query("SELECT m FROM Medicine m WHERE m.supplier.id = :supplierId")
    List<Medicine> findAllBySupplier_Id(@Param("supplierId") Long supplierId);

    @Query("SELECT m FROM Medicine m " +
           "LEFT JOIN FETCH m.category " +
           "LEFT JOIN FETCH m.supplier " +
           "WHERE (m.supplier.id = :supplierId OR (m.supplier IS NOT NULL AND LOWER(m.supplier.companyName) = LOWER(:companyName))) " +
           "AND (:query IS NULL OR :query = '' OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(m.batchNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:categoryId IS NULL OR m.category.id = :categoryId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "ORDER BY m.name ASC")
    List<Medicine> findSuppliedMedicines(
            @Param("supplierId") Long supplierId,
            @Param("companyName") String companyName,
            @Param("query") String query,
            @Param("categoryId") Long categoryId,
            @Param("status") MedicineStatus status
    );

    @Query("SELECT m FROM Medicine m WHERE m.status = :status AND " +
           "(:query IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.batchNumber) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:categoryId IS NULL OR m.category.id = :categoryId) AND " +
           "(:supplierId IS NULL OR m.supplier.id = :supplierId)")
    Page<Medicine> searchMedicines(
            @Param("query") String query,
            @Param("categoryId") Long categoryId,
            @Param("supplierId") Long supplierId,
            @Param("status") MedicineStatus status,
            Pageable pageable
    );

    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.quantity <= m.minimumStockLevel AND m.quantity > 0")
    List<Medicine> findLowStockMedicines();

    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.quantity = 0")
    List<Medicine> findOutOfStockMedicines();

    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.expiryDate >= :today AND m.expiryDate <= :warningDate ORDER BY m.expiryDate ASC")
    List<Medicine> findNearExpiryMedicines(@Param("today") LocalDate today, @Param("warningDate") LocalDate warningDate);

    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.expiryDate < :today ORDER BY m.expiryDate ASC")
    List<Medicine> findExpiredMedicines(@Param("today") LocalDate today);
}
