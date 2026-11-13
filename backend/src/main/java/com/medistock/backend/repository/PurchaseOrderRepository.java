package com.medistock.backend.repository;

import com.medistock.backend.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findAllByOrderByCreatedAtDescIdDesc();
    List<PurchaseOrder> findBySupplierIdOrderByCreatedAtDescIdDesc(Long supplierId);
}
