package com.medistock.medistock.repository;

import com.medistock.medistock.entity.GoodsReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptItemRepository extends JpaRepository<GoodsReceiptItem, Integer> {
    List<GoodsReceiptItem> findByGoodsReceipt_ReceiptId(Integer receiptId);
}

