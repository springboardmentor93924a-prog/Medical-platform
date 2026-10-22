
package com.medistock.controller;

import com.medistock.entity.Inventory;
import com.medistock.repository.InventoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryRepository inventoryRepository;

    public InventoryController(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @GetMapping("/low-stock")
    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    @GetMapping("/{id}")
    public Inventory getInventoryById(@PathVariable Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Inventory item not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Inventory createInventory(@RequestBody Inventory inventory) {
        validateInventory(inventory);
        inventory.setInventoryId(null);
        return inventoryRepository.save(inventory);
    }

    @PutMapping("/{id}")
    public Inventory updateInventory(
            @PathVariable Long id,
            @RequestBody Inventory updatedInventory) {

        Inventory existing = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Inventory item not found"));

        validateInventory(updatedInventory);

        existing.setMedicineId(updatedInventory.getMedicineId());
        existing.setSupplierId(updatedInventory.getSupplierId());
        existing.setBatchNumber(updatedInventory.getBatchNumber());
        existing.setQuantity(updatedInventory.getQuantity());
        existing.setMinimumStock(updatedInventory.getMinimumStock());
        existing.setUnitPrice(updatedInventory.getUnitPrice());
        existing.setManufacturingDate(updatedInventory.getManufacturingDate());
        existing.setExpiryDate(updatedInventory.getExpiryDate());

        return inventoryRepository.save(existing);
    }

    private void validateInventory(Inventory inventory) {
        if (inventory.getMedicineId() == null
                || inventory.getMedicineId() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "A valid medicine ID is required");
        }

        if (inventory.getBatchNumber() == null
                || inventory.getBatchNumber().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Batch number is required");
        }

        if (inventory.getQuantity() == null || inventory.getQuantity() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Quantity cannot be negative");
        }

        if (inventory.getMinimumStock() == null
                || inventory.getMinimumStock() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Minimum stock cannot be negative");
        }

        if (inventory.getUnitPrice() == null
                || inventory.getUnitPrice().signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Unit price cannot be negative");
        }

        if (inventory.getExpiryDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Expiry date is required");
        }
    }
}
