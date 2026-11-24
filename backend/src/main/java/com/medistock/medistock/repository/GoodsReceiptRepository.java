package com.medistock.medistock.repository;

import com.medistock.medistock.entity.GoodsReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Integer> {
    List<GoodsReceipt> findAllByOrderByReceivedAtDesc();
    List<GoodsReceipt> findByPurchaseOrderIdOrderByReceivedAtDesc(Integer purchaseOrderId);
    Optional<GoodsReceipt> findByReceiptNumber(String receiptNumber);
    boolean existsByPurchaseOrderId(Integer purchaseOrderId);
}

