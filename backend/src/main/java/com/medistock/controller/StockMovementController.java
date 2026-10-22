
package com.medistock.controller;

import com.medistock.dto.StockMovementRequest;
import com.medistock.entity.StockLog;
import com.medistock.entity.User;
import com.medistock.repository.StockLogRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.StockMovementService;

import org.springframework.http.HttpStatus;
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

    public StockMovementController(
            StockMovementService stockMovementService,
            StockLogRepository stockLogRepository,
            UserRepository userRepository) {
        this.stockMovementService = stockMovementService;
        this.stockLogRepository = stockLogRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<StockLog> getAllMovements() {
        return stockLogRepository.findAllByOrderByChangedAtDesc();
    }

    @GetMapping("/inventory/{inventoryId}")
    public List<StockLog> getInventoryMovements(
            @PathVariable Long inventoryId) {
        return stockLogRepository
                .findByInventoryIdOrderByChangedAtDesc(inventoryId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StockLog recordMovement(
            @RequestBody StockMovementRequest request,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Please log in");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Authenticated user not found"));

        return stockMovementService.recordMovement(
                request, user.getUserId());
    }
}
