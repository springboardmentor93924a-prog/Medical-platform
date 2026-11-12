
package com.medistock.repository;

import com.medistock.entity.Inventory;
import com.medistock.dto.InventoryMedicineDTO;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    // Find low-stock inventory batches
    @Query("""
        SELECT i FROM Inventory i
        WHERE i.quantity <= i.minimumStock
        ORDER BY i.quantity ASC
    """)
    List<Inventory> findLowStockItems();

    // Search inventory by batch number
    @Query("""
        SELECT i FROM Inventory i
        WHERE LOWER(i.batchNumber) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY i.expiryDate ASC
    """)
    Page<Inventory> search(
            @Param("q") String q,
            Pageable pageable
    );

    // Find batches with an expiry date within the given limit
    @Query("""
        SELECT i FROM Inventory i
        WHERE i.expiryDate IS NOT NULL
        AND i.expiryDate <= :expiryLimit
        ORDER BY i.expiryDate ASC
    """)
    List<Inventory> findExpiringByDate(
            @Param("expiryLimit") LocalDate expiryLimit
    );

    // Fetch inventory together with medicine details
    @Query("""
        SELECT new com.medistock.dto.InventoryMedicineDTO(
            i.inventoryId,
            i.medicineId,
            m.medicineName,
            m.category,
            m.description,
            i.supplierId,
            i.batchNumber,
            i.quantity,
            i.minimumStock,
            i.unitPrice,
            i.manufacturingDate,
            i.expiryDate
        )
        FROM Inventory i
        JOIN Medicine m ON m.medicineId = i.medicineId
        ORDER BY i.inventoryId DESC
    """)
    List<InventoryMedicineDTO> findInventoryWithMedicineDetails();

    // Find eligible batches in FEFO order and lock them
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT i FROM Inventory i
        WHERE i.medicineId = :medicineId
        AND i.quantity > 0
        AND i.expiryDate IS NOT NULL
        AND i.expiryDate >= :today
        ORDER BY i.expiryDate ASC, i.inventoryId ASC
    """)
    List<Inventory> findEligibleBatchesForFefo(
            @Param("medicineId") Long medicineId,
            @Param("today") LocalDate today
    );

    // Lock inventory record while updating stock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT i FROM Inventory i
        WHERE i.inventoryId = :id
    """)
    Optional<Inventory> findByIdForUpdate(
            @Param("id") Long id
    );

    // Find unique medicines supplied by a supplier
    @Query("""
        SELECT DISTINCT m.medicineName
        FROM Inventory i
        JOIN Medicine m ON m.medicineId = i.medicineId
        WHERE i.supplierId = :supplierId
        ORDER BY m.medicineName
    """)
    List<String> findMedicineNamesBySupplierId(
            @Param("supplierId") Long supplierId
    );

    // AI: Find inventory batches with available stock
    List<Inventory> findByQuantityGreaterThan(Integer quantity);


    // Get inventory batches belonging to a specific supplier
    @Query("""
        SELECT new com.medistock.dto.InventoryMedicineDTO(
            i.inventoryId,
            i.medicineId,
            m.medicineName,
            m.category,
            m.description,
            i.supplierId,
            i.batchNumber,
            i.quantity,
            i.minimumStock,
            i.unitPrice,
            i.manufacturingDate,
            i.expiryDate
        )
        FROM Inventory i
        JOIN Medicine m ON m.medicineId = i.medicineId
        WHERE i.supplierId = :supplierId
        ORDER BY i.inventoryId DESC
    """)
    List<InventoryMedicineDTO> findInventoryWithMedicineDetailsBySupplierId(
            @Param("supplierId") Long supplierId
    );


    // AI: Find all batches belonging to a medicine
    List<Inventory> findByMedicineId(Long medicineId);
}
