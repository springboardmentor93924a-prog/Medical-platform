package com.medistock.medistock.repository;

import com.medistock.medistock.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {

    List<PurchaseOrder> findAllByOrderByOrderDateDesc();

    List<PurchaseOrder> findBySupplierIdOrderByOrderDateDesc(Integer supplierId);

    List<PurchaseOrder> findBySupplierIdAndStatusOrderByOrderDateDesc(Integer supplierId, String status);

    List<PurchaseOrder> findByCreatedByOrderByOrderDateDesc(Integer createdBy);

    long countBySupplierId(Integer supplierId);

    long countBySupplierIdAndStatus(Integer supplierId, String status);

    long countByStatus(String status);

    long countByCreatedBy(Integer createdBy);

    long countByCreatedByAndStatus(Integer createdBy, String status);

    List<PurchaseOrder> findByStatusIn(List<String> statuses);
}
