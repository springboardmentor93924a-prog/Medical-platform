package com.medistock.medistock.repository;

import com.medistock.medistock.entity.InventoryBatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Integer> {

    List<InventoryBatch> findByMedicineId(Integer medicineId);

    Optional<InventoryBatch> findByBatchNumber(String batchNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM InventoryBatch b WHERE b.batchId = :batchId")
    Optional<InventoryBatch> findByIdForUpdate(@Param("batchId") Integer batchId);

    @Modifying
    @Query("UPDATE InventoryBatch b SET b.quantityAvailable = b.quantityAvailable - :qty " +
           "WHERE b.batchId = :batchId AND b.quantityAvailable >= :qty")
    int deductStock(@Param("batchId") Integer batchId, @Param("qty") Integer qty);

    @Modifying
    @Query("UPDATE InventoryBatch b SET b.status = 'DEPLETED' " +
           "WHERE b.batchId = :batchId AND b.quantityAvailable = 0")
    int markDepletedIfZero(@Param("batchId") Integer batchId);

    @Query("SELECT b FROM InventoryBatch b WHERE b.medicineId = :medicineId " +
           "AND b.quantityAvailable > 0 " +
           "AND (b.status = 'ACTIVE' OR b.status = 'VALID') " +
           "AND b.expiryDate >= :today " +
           "ORDER BY b.expiryDate ASC, b.batchId ASC")
    List<InventoryBatch> findEligibleBatchesForMedicine(
            @Param("medicineId") Integer medicineId,
            @Param("today") LocalDate today);

    @Query("SELECT b FROM InventoryBatch b WHERE b.medicineId = :medicineId " +
           "ORDER BY b.expiryDate ASC, b.batchId ASC")
    List<InventoryBatch> findAllBatchesForMedicineOrderByExpiry(
            @Param("medicineId") Integer medicineId);

    @Query("SELECT COUNT(b) FROM InventoryBatch b WHERE b.quantityAvailable > 0 " +
           "AND (b.status = 'ACTIVE' OR b.status = 'VALID') " +
           "AND b.expiryDate >= :today")
    long countEligibleBatches(@Param("today") LocalDate today);

    @Query("SELECT COUNT(b) FROM InventoryBatch b WHERE b.expiryDate < :today OR b.status = 'EXPIRED'")
    long countExpiredBatches(@Param("today") LocalDate today);

    @Query("SELECT COUNT(b) FROM InventoryBatch b WHERE b.quantityAvailable > 0 " +
           "AND b.expiryDate >= :today AND b.expiryDate <= :cutoff " +
           "AND (b.status = 'ACTIVE' OR b.status = 'VALID')")
    long countExpiringSoonBatches(@Param("today") LocalDate today, @Param("cutoff") LocalDate cutoff);

    List<InventoryBatch> findByQuantityAvailableLessThanEqualOrderByQuantityAvailableAsc(Integer threshold);

    List<InventoryBatch> findByExpiryDateLessThanEqualAndQuantityAvailableGreaterThanOrderByExpiryDateAsc(LocalDate date, Integer minQty);

    long countByQuantityAvailableLessThanEqual(Integer threshold);

    long countByExpiryDateLessThanEqualAndQuantityAvailableGreaterThan(LocalDate date, Integer minQty);

    @Query("SELECT COALESCE(SUM(b.quantityAvailable * b.purchaseCost), 0) FROM InventoryBatch b")
    BigDecimal calculateTotalInventoryValue();

    @Query("SELECT COALESCE(SUM(b.quantityAvailable), 0) FROM InventoryBatch b")
    Long calculateTotalUnitsAvailable();

    @Query("SELECT b FROM InventoryBatch b WHERE " +
           "LOWER(b.batchNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.medicine.medicineName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.medicine.genericName) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<InventoryBatch> searchBatches(@Param("search") String search);
}
