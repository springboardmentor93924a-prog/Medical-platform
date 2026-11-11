package com.medistock.medistock.repository;

import com.medistock.medistock.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import jakarta.persistence.LockModeType;

@Repository
public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Integer> {

    List<MedicineBatch> findByMedicineMedicineId(Integer medicineId);

    boolean existsByMedicine_MedicineIdAndBatchNumber(Integer medicineId, String batchNumber);

    boolean existsByMedicine_MedicineIdAndBatchNumberAndBatchIdNot(
            Integer medicineId, String batchNumber, Integer batchId);

    List<MedicineBatch> findBySupplier_SupplierId(Integer supplierId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT batch FROM MedicineBatch batch
            JOIN FETCH batch.medicine
            WHERE batch.medicine.medicineId = :medicineId
              AND batch.quantity > 0
              AND batch.expiryDate >= :today
            ORDER BY batch.expiryDate ASC, batch.batchId ASC
            """)
    List<MedicineBatch> findSellableBatchesForUpdate(
            @Param("medicineId") Integer medicineId,
            @Param("today") LocalDate today);

    @Query("""
            SELECT batch FROM MedicineBatch batch
            JOIN FETCH batch.medicine medicine
            WHERE batch.quantity > 0
              AND batch.expiryDate >= :today
            ORDER BY batch.expiryDate ASC, batch.batchId ASC
            """)
    List<MedicineBatch> findAllSellableBatches(@Param("today") LocalDate today);

    boolean existsBySupplier_SupplierId(Integer supplierId);

    @Query("SELECT COALESCE(SUM(b.quantity * b.purchasePrice), 0) FROM MedicineBatch b")
    BigDecimal calculateTotalInventoryValue();

    @Query("SELECT COUNT(DISTINCT b.medicine.medicineId) FROM MedicineBatch b WHERE b.quantity > b.reorderLevel")
    long countInStockMedicines();

    @Query("SELECT COUNT(DISTINCT b.medicine.medicineId) FROM MedicineBatch b WHERE b.quantity > 0 AND b.quantity <= b.reorderLevel")
    long countLowStockMedicines();

    @Query("SELECT COUNT(DISTINCT b.medicine.medicineId) FROM MedicineBatch b WHERE b.quantity = 0")
    long countOutOfStockMedicines();

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.expiryDate < :currentDate")
    long countExpiredBatches(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.expiryDate >= :currentDate AND b.expiryDate <= :targetDate")
    long countNearExpiryBatches(@Param("currentDate") LocalDate currentDate, @Param("targetDate") LocalDate targetDate);

    @Query("SELECT b.medicine.medicineName, SUM(b.quantity) as totalQty " +
           "FROM MedicineBatch b " +
           "GROUP BY b.medicine.medicineId, b.medicine.medicineName " +
           "ORDER BY totalQty DESC")
    List<Object[]> findTopStockedMedicines();
}
