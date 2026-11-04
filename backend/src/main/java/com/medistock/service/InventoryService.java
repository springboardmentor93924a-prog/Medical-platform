
package com.medistock.service;

import com.medistock.entity.Inventory;
import com.medistock.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    // Get all inventory batches
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    // Get inventory batch by ID
    public Inventory getInventoryById(Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Inventory batch not found with ID: " + id));
    }

    // Get low-stock batches
    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    // Add inventory batch
    @Transactional
    public Inventory addInventory(Inventory inventory) {

        validateInventory(inventory);

        // Expiry date is optional
        return inventoryRepository.save(inventory);
    }

    // Update inventory batch
    @Transactional
    public Inventory updateInventory(Long id, Inventory updatedInventory) {

        Inventory existingInventory = getInventoryById(id);

        validateInventory(updatedInventory);

        existingInventory.setMedicineId(updatedInventory.getMedicineId());
        existingInventory.setSupplierId(updatedInventory.getSupplierId());
        existingInventory.setBatchNumber(updatedInventory.getBatchNumber());
        existingInventory.setQuantity(updatedInventory.getQuantity());
        existingInventory.setMinimumStock(updatedInventory.getMinimumStock());
        existingInventory.setUnitPrice(updatedInventory.getUnitPrice());
        existingInventory.setManufacturingDate(
                updatedInventory.getManufacturingDate()
        );

        // Allow null expiry date
        existingInventory.setExpiryDate(updatedInventory.getExpiryDate());

        return inventoryRepository.save(existingInventory);
    }

    // Delete inventory batch
    @Transactional
    public void deleteInventory(Long id) {

        Inventory inventory = getInventoryById(id);

        inventoryRepository.delete(inventory);
    }

    // Validate inventory fields
    private void validateInventory(Inventory inventory) {

        if (inventory.getMedicineId() == null) {
            throw new RuntimeException("Medicine is required");
        }

        if (inventory.getBatchNumber() == null ||
                inventory.getBatchNumber().trim().isEmpty()) {
            throw new RuntimeException("Batch number is required");
        }

        if (inventory.getQuantity() == null ||
                inventory.getQuantity() < 0) {
            throw new RuntimeException("Quantity cannot be negative");
        }

        if (inventory.getMinimumStock() == null ||
                inventory.getMinimumStock() < 0) {
            throw new RuntimeException("Minimum stock cannot be negative");
        }

        if (inventory.getUnitPrice() == null ||
                inventory.getUnitPrice().signum() < 0) {
            throw new RuntimeException("Valid unit price is required");
        }

        if (inventory.getManufacturingDate() != null &&
                inventory.getExpiryDate() != null &&
                inventory.getExpiryDate().isBefore(
                        inventory.getManufacturingDate())) {
            throw new RuntimeException(
                    "Expiry date must not be before manufacturing date"
            );
        }
    }
}
