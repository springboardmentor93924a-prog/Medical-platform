package com.medistock.medistock.repository;

import com.medistock.medistock.entity.PurchaseOrder;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {

    @Query("SELECT po FROM PurchaseOrder po ORDER BY po.orderDate DESC, po.purchaseOrderId DESC")
    List<PurchaseOrder> findRecentPurchaseOrders(Pageable pageable);

    @Query("""
            SELECT DISTINCT po FROM PurchaseOrder po
            JOIN FETCH po.supplier
            JOIN FETCH po.user
            LEFT JOIN FETCH po.items item
            LEFT JOIN FETCH item.medicine
            ORDER BY po.orderDate DESC, po.purchaseOrderId DESC
            """)
    List<PurchaseOrder> findAllWithDetails();

    @Query("""
            SELECT DISTINCT po FROM PurchaseOrder po
            JOIN FETCH po.supplier
            JOIN FETCH po.user
            LEFT JOIN FETCH po.items item
            LEFT JOIN FETCH item.medicine
            WHERE po.purchaseOrderId = :id
            """)
    Optional<PurchaseOrder> findDetailedById(@Param("id") Integer id);

    boolean existsBySupplier_SupplierId(Integer supplierId);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po")
    long countTotalPurchaseOrders();
}
