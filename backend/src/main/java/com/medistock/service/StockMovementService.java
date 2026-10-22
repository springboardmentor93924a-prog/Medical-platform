
package com.medistock.service;

import com.medistock.dto.StockMovementRequest;
import com.medistock.entity.Inventory;
import com.medistock.entity.StockLog;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.StockLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StockMovementService {

    private final InventoryRepository inventoryRepository;
    private final StockLogRepository stockLogRepository;

    public StockMovementService(
            InventoryRepository inventoryRepository,
            StockLogRepository stockLogRepository) {
        this.inventoryRepository = inventoryRepository;
        this.stockLogRepository = stockLogRepository;
    }

    @Transactional
    public StockLog recordMovement(StockMovementRequest request, Long userId) {
        if (request.getInventoryId() == null
                || request.getChangeQuantity() == null
                || request.getChangeQuantity() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Inventory ID and a positive movement quantity are required");
        }

        String type = request.getMovementType() == null
                ? ""
                : request.getMovementType().trim().toUpperCase();

        if (!type.equals("IN") && !type.equals("OUT")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Movement type must be IN or OUT");
        }

        Inventory inventory = inventoryRepository
                .findById(request.getInventoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Inventory batch not found"));

        int currentQuantity = inventory.getQuantity();
        int movementQuantity = request.getChangeQuantity();

        if (type.equals("OUT") && movementQuantity > currentQuantity) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient stock for this movement");
        }

        inventory.setQuantity(type.equals("IN")
                ? Math.addExact(currentQuantity, movementQuantity)
                : currentQuantity - movementQuantity);

        inventoryRepository.save(inventory);

        StockLog log = new StockLog();
        log.setInventoryId(inventory.getInventoryId());
        log.setUserId(userId);
        log.setChangeQuantity(type.equals("IN")
                ? movementQuantity : -movementQuantity);
        log.setMovementType(type);
        log.setNotes(request.getNotes());

        return stockLogRepository.save(log);
    }
}
