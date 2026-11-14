package com.medistock.service;

import com.medistock.dto.request.StockMovementRequest;
import com.medistock.entity.StockMovement;
import com.medistock.enums.MovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StockMovementService {
    StockMovement recordMovement(StockMovementRequest request, String userEmail);
    Page<StockMovement> getMovements(Long medicineId, MovementType movementType, Pageable pageable);
    List<StockMovement> getMovementsForMedicine(Long medicineId);
}
