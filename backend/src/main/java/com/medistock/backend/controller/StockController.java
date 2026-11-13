package com.medistock.backend.controller;

import com.medistock.backend.dto.InventoryDtos.InventoryRow;
import com.medistock.backend.dto.StockDtos.*;
import com.medistock.backend.service.StockService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class StockController {
    private final StockService service;

    public StockController(StockService service) { this.service = service; }

    // Staff do not change quantities directly. They record counts under Stock Checking, which is reviewed.
    @PutMapping("/{batchId}/stock")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public InventoryRow updateStock(@PathVariable Long batchId, @Valid @RequestBody StockUpdateRequest r,
                                    Authentication auth) {
        return service.updateQuantity(batchId, r, auth.getName());
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public List<StockLogResponse> history(@RequestParam(required = false) Long batchId,
                                          @RequestParam(defaultValue = "50") int limit) {
        return service.history(batchId, limit);
    }
}
