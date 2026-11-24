package com.medistock.medistock.repository;

import com.medistock.medistock.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Integer> {
    List<PurchaseOrderItem> findByPurchaseOrderId(Integer purchaseOrderId);

    @Query("SELECT poi FROM PurchaseOrderItem poi JOIN poi.purchaseOrder po " +
           "WHERE po.status IN ('APPROVED', 'ORDERED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED')")
    List<PurchaseOrderItem> findActiveIncomingOrderItems();

    @Query("SELECT COALESCE(SUM(poi.quantity), 0) FROM PurchaseOrderItem poi JOIN poi.purchaseOrder po " +
           "WHERE poi.medicineId = :medicineId AND po.status IN ('APPROVED', 'ORDERED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED')")
    Integer countIncomingUnitsForMedicine(@Param("medicineId") Integer medicineId);

    List<PurchaseOrderItem> findByMedicineIdOrderByPurchaseOrderItemIdDesc(Integer medicineId);
}
