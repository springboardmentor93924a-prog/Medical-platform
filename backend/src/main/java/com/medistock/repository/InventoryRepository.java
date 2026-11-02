
package com.medistock.repository;

import com.medistock.entity.Inventory;
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

    // Lock inventory record while updating stock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT i FROM Inventory i
        WHERE i.inventoryId = :id
    """)
    Optional<Inventory> findByIdForUpdate(
            @Param("id") Long id
    );
}
