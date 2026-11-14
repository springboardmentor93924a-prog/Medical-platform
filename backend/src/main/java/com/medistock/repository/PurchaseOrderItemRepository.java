package com.medistock.repository;

import com.medistock.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
    @Query("SELECT poi FROM PurchaseOrderItem poi WHERE poi.purchaseOrder.id = :purchaseOrderId")
    List<PurchaseOrderItem> findByPurchaseOrderId(@Param("purchaseOrderId") Long purchaseOrderId);

    @Modifying
    @Query("DELETE FROM PurchaseOrderItem poi WHERE poi.purchaseOrder.id = :purchaseOrderId")
    void deleteByPurchaseOrderId(@Param("purchaseOrderId") Long purchaseOrderId);
}
