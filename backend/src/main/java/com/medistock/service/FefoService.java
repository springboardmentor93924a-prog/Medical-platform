
package com.medistock.service;

import com.medistock.dto.DispenseRequest;
import com.medistock.dto.StockMovementRequest;
import com.medistock.entity.Inventory;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FefoService {

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final StockMovementService stockMovementService;

    public FefoService(
            InventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            StockMovementService stockMovementService) {

        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.stockMovementService = stockMovementService;
    }

    @Transactional
    public Map<String, Object> dispense(
            DispenseRequest request,
            Long userId) {

        if (request == null || request.getMedicineId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Medicine ID is required"
            );
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dispensing quantity must be greater than zero"
            );
        }

        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user is required"
            );
        }

        Long medicineId = request.getMedicineId();
        int requestedQuantity = request.getQuantity();

        if (!medicineRepository.existsById(medicineId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Medicine not found"
            );
        }

        LocalDate today = LocalDate.now();

        // Fetch eligible batches in earliest-expiry order.
        List<Inventory> batches =
                inventoryRepository.findEligibleBatchesForFefo(
                        medicineId,
                        today
                );

        // Check total stock before making any changes.
        long totalAvailable = batches.stream()
                .mapToLong(batch -> batch.getQuantity())
                .sum();

        if (totalAvailable < requestedQuantity) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Insufficient unexpired stock. Available: "
                            + totalAvailable
                            + ", Requested: "
                            + requestedQuantity
            );
        }

        int remainingQuantity = requestedQuantity;

        List<Map<String, Object>> dispensedBatches =
                new ArrayList<>();

        // Dispense from earliest-expiring batch first.
        for (Inventory batch : batches) {

            if (remainingQuantity == 0) {
                break;
            }

            int available = batch.getQuantity();

            int dispenseQuantity = Math.min(
                    available,
                    remainingQuantity
            );

            StockMovementRequest movement =
                    new StockMovementRequest();

            movement.setInventoryId(batch.getInventoryId());
            movement.setMovementType("OUT");
            movement.setChangeQuantity(dispenseQuantity);

            String notes = "FEFO dispensing";

            if (request.getNotes() != null
                    && !request.getNotes().isBlank()) {
                notes += " - " + request.getNotes().trim();
            }

            movement.setNotes(notes);

            // Existing service handles stock, stock log,
            // audit activity and low-stock notification.
            stockMovementService.recordMovement(
                    movement,
                    userId
            );

            Map<String, Object> batchResult =
                    new LinkedHashMap<>();

            batchResult.put("inventoryId", batch.getInventoryId());
            batchResult.put("batchNumber", batch.getBatchNumber());
            batchResult.put("expiryDate", batch.getExpiryDate());
            batchResult.put("dispensedQuantity", dispenseQuantity);
            batchResult.put(
                    "remainingQuantity",
                    available - dispenseQuantity
            );

            dispensedBatches.add(batchResult);

            remainingQuantity -= dispenseQuantity;
        }

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "FEFO dispensing completed successfully");
        response.put("medicineId", medicineId);
        response.put("requestedQuantity", requestedQuantity);
        response.put("dispensedQuantity", requestedQuantity);
        response.put("dispensedBatches", dispensedBatches);

        return response;
    }
}
