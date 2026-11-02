package com.medistock.repository;

import com.medistock.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository
        extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByInventoryIdOrderByCreatedAtDesc(
            Long inventoryId
    );

    List<StockMovement> findAllByOrderByCreatedAtDesc();
}