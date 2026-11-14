package com.medistock.controller;

import com.medistock.dto.request.StockMovementRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.StockMovement;
import com.medistock.enums.MovementType;
import com.medistock.service.StockMovementService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/inventory/movements", "/api/v1/stock/movements"})
public class StockMovementController {

    private final StockMovementService stockMovementService;

    public StockMovementController(StockMovementService stockMovementService) {
        this.stockMovementService = stockMovementService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<StockMovement>> recordMovement(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StockMovementRequest request) {
        StockMovement movement = stockMovementService.recordMovement(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock movement recorded successfully", movement));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<Page<StockMovement>>> getMovements(
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) MovementType movementType,
            @RequestParam(required = false) MovementType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        MovementType filterType = movementType != null ? movementType : type;
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(stockMovementService.getMovements(medicineId, filterType, pageable)));
    }

    @GetMapping("/medicine/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<List<StockMovement>>> getMovementsForMedicine(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(stockMovementService.getMovementsForMedicine(id)));
    }
}
