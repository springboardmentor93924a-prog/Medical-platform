
package com.medistock.controller;

import com.medistock.dto.StockMovementRequest;
import com.medistock.entity.StockLog;
import com.medistock.entity.User;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.StockLogRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.StockMovementService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementService stockMovementService;
    private final StockLogRepository stockLogRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;

    public StockMovementController(
            StockMovementService stockMovementService,
            StockLogRepository stockLogRepository,
            UserRepository userRepository,
            InventoryRepository inventoryRepository) {

        this.stockMovementService = stockMovementService;
        this.stockLogRepository = stockLogRepository;
        this.userRepository = userRepository;
        this.inventoryRepository = inventoryRepository;
    }

    // Get all stock movements
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<StockLog> getAllMovements() {

        return stockLogRepository.findAllByOrderByChangedAtDesc();
    }

    // Get stock movements for a particular inventory batch
    @GetMapping("/inventory/{inventoryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<StockLog> getInventoryMovements(
            @PathVariable Long inventoryId) {

        if (!inventoryRepository.existsById(inventoryId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Inventory batch not found"
            );
        }

        return stockLogRepository
                .findByInventoryIdOrderByChangedAtDesc(inventoryId);
    }

    // Record stock IN or OUT
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public StockLog recordMovement(
            @RequestBody StockMovementRequest request,
            Authentication authentication) {

        // Validate authentication
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        // Find the logged-in user
        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"
                ));

        // Record stock movement
        return stockMovementService.recordMovement(
                request,
                user.getUserId()
        );
    }
}
