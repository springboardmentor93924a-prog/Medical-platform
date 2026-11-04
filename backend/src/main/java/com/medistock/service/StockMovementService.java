
package com.medistock.service;

import com.medistock.dto.StockMovementRequest;
import com.medistock.entity.Inventory;
import com.medistock.entity.StockLog;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.StockLogRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StockMovementService {

    private final InventoryRepository inventoryRepository;
    private final StockLogRepository stockLogRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public StockMovementService(
            InventoryRepository inventoryRepository,
            StockLogRepository stockLogRepository,
            AuditService auditService,
            NotificationService notificationService) {

        this.inventoryRepository = inventoryRepository;
        this.stockLogRepository = stockLogRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public StockLog recordMovement(
            StockMovementRequest request,
            Long userId) {

        // Validate request
        if (request == null
                || request.getInventoryId() == null
                || request.getChangeQuantity() == null
                || request.getChangeQuantity() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Inventory ID and a positive movement quantity are required"
            );
        }

        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user is required"
            );
        }

        if (request.getMovementType() == null
                || request.getMovementType().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Movement type is required"
            );
        }

        String type = request.getMovementType()
                .trim()
                .toUpperCase();

        if (!type.equals("IN") && !type.equals("OUT")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Movement type must be IN or OUT"
            );
        }

        int movementQuantity = request.getChangeQuantity();

        // Fetch inventory using a database lock
        Inventory inventory = inventoryRepository
                .findByIdForUpdate(request.getInventoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inventory batch not found"
                ));

        // Validate existing quantity
        if (inventory.getQuantity() == null
                || inventory.getQuantity() < 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Inventory contains an invalid stock quantity"
            );
        }

        int currentQuantity = inventory.getQuantity();
        int newQuantity;

        // Calculate new stock quantity
        if (type.equals("IN")) {

            try {
                newQuantity = Math.addExact(
                        currentQuantity,
                        movementQuantity
                );

            } catch (ArithmeticException ex) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Stock quantity exceeds the supported limit"
                );
            }

        } else {

            if (movementQuantity > currentQuantity) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient stock. Available quantity: "
                                + currentQuantity
                );
            }

            newQuantity = currentQuantity - movementQuantity;
        }

        // Update inventory quantity
        inventory.setQuantity(newQuantity);
        inventoryRepository.save(inventory);

        // Create stock movement history
        StockLog log = new StockLog();

        log.setInventoryId(inventory.getInventoryId());
        log.setUserId(userId);
        log.setMovementType(type);

        // IN = positive quantity, OUT = negative quantity
        log.setChangeQuantity(
                type.equals("IN")
                        ? movementQuantity
                        : -movementQuantity
        );

        log.setNotes(
                request.getNotes() == null
                        ? null
                        : request.getNotes().trim()
        );

        StockLog saved = stockLogRepository.save(log);

        // Record audit activity
        String action = type.equals("IN")
                ? "STOCK_IN"
                : "STOCK_OUT";

        String description =
                (type.equals("IN") ? "Received " : "Issued ")
                        + movementQuantity
                        + " units of batch "
                        + inventory.getBatchNumber()
                        + (request.getNotes() == null
                        || request.getNotes().isBlank()
                        ? ""
                        : " (" + request.getNotes().trim() + ")");

        auditService.record(
                action,
                "INVENTORY",
                inventory.getInventoryId(),
                description
        );

        // Check low-stock notification
        notificationService.notifyLowStock(inventory);

        return saved;
    }
}
