
package com.medistock.repository;

import com.medistock.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    @Query("""
        SELECT i FROM Inventory i
        WHERE i.quantity <= i.minimumStock
        ORDER BY i.quantity ASC
    """)
    List<Inventory> findLowStockItems();

    @Query("""
        SELECT i FROM Inventory i
        WHERE LOWER(i.batchNumber) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY i.expiryDate
    """)
    Page<Inventory> search(@Param("q") String q, Pageable pageable);
}
