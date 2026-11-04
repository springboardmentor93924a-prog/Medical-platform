
package com.medistock.service;

import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.medistock.entity.Supplier;
import com.medistock.repository.SupplierRepository;

import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import com.medistock.dto.ProfileRequest;
import com.medistock.dto.ProfileResponse;

@Service
public class PharmacistService {

    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;

    public PharmacistService(
        InventoryRepository inventoryRepository,
        MedicineRepository medicineRepository,
        SupplierRepository supplierRepository,
        UserRepository userRepository) {

    this.inventoryRepository = inventoryRepository;
    this.medicineRepository = medicineRepository;
    this.supplierRepository = supplierRepository;
    this.userRepository = userRepository;
}


    // Get pharmacist dashboard summary
public Map<String, Object> getDashboard() {
    LocalDate today = LocalDate.now();
    LocalDate expiryLimit = today.plusDays(30);

    List<Inventory> inventory = inventoryRepository.findAll();

    long totalBatches = inventory.size();

    long totalStockUnits = inventory.stream()
            .mapToLong(i -> i.getQuantity() == null ? 0 : i.getQuantity())
            .sum();

    long lowStockBatches = inventoryRepository
            .findLowStockItems().size();

   long expiredBatches = inventory.stream()
        .filter(i -> i.getExpiryDate() != null)
        .filter(i -> i.getExpiryDate().isBefore(today))
        .count();

    long expiringSoonBatches = inventory.stream()
        .filter(i -> i.getExpiryDate() != null)
        .filter(i -> !i.getExpiryDate().isBefore(today))
        .filter(i -> !i.getExpiryDate().isAfter(expiryLimit))
        .count();

    Map<String, Object> dashboard = new LinkedHashMap<>();
    dashboard.put("totalBatches", totalBatches);
    dashboard.put("totalStockUnits", totalStockUnits);
    dashboard.put("lowStockBatches", lowStockBatches);
    dashboard.put("expiredBatches", expiredBatches);
    dashboard.put("expiringSoonBatches", expiringSoonBatches);

    return dashboard;
}

    // Get all medicines
    public List<Medicine> getMedicines() {
        return medicineRepository.findAll();
    }


    
    // Get medicine by ID
    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Medicine not found with ID: " + id
                        ));
    }

    // Add a new medicine
    public Medicine addMedicine(Medicine medicine) {
        medicine.setMedicineId(null);
        return medicineRepository.save(medicine);
    }

    // Update an existing medicine
    public Medicine updateMedicine(Long id, Medicine updatedMedicine) {
        Medicine existing = getMedicineById(id);

        existing.setMedicineName(updatedMedicine.getMedicineName());
        existing.setCategory(updatedMedicine.getCategory());
        existing.setDescription(updatedMedicine.getDescription());

        return medicineRepository.save(existing);
    }

    // Delete a medicine
    public void deleteMedicine(Long id) {
        Medicine existing = getMedicineById(id);
        medicineRepository.delete(existing);
    }


    // Add a new inventory batch
// Add a new inventory batch
public Inventory addInventory(Inventory inventory) {

    if (inventory.getMedicineId() == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Medicine ID is required"
        );
    }

    if (!medicineRepository.existsById(inventory.getMedicineId())) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Medicine not found"
        );
    }

    if (inventory.getBatchNumber() == null
            || inventory.getBatchNumber().isBlank()) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Batch number is required"
        );
    }

    if (inventory.getQuantity() == null
            || inventory.getQuantity() < 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Quantity must be zero or greater"
        );
    }

    if (inventory.getUnitPrice() == null
            || inventory.getUnitPrice().signum() < 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Unit price must be zero or greater"
        );
    }

    // Expiry date is optional
    validateInventoryDates(inventory);

    inventory.setInventoryId(null);
    inventory.setBatchNumber(inventory.getBatchNumber().trim());

    return inventoryRepository.save(inventory);
}


    
    
// ================= UPDATE INVENTORY =================

// Update inventory batch
public Inventory updateInventory(Long id, Inventory updatedInventory) {

    Inventory existing = inventoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Inventory batch not found with ID: " + id
            ));

    if (updatedInventory.getMedicineId() == null
            || !medicineRepository.existsById(
                    updatedInventory.getMedicineId())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A valid medicine ID is required"
        );
    }

    if (updatedInventory.getBatchNumber() == null
            || updatedInventory.getBatchNumber().isBlank()) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Batch number is required"
        );
    }

    if (updatedInventory.getQuantity() == null
            || updatedInventory.getQuantity() < 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Quantity must be zero or greater"
        );
    }

    if (updatedInventory.getUnitPrice() == null
            || updatedInventory.getUnitPrice().signum() < 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Unit price must be zero or greater"
        );
    }

    // Expiry date is optional
    validateInventoryDates(updatedInventory);

    existing.setMedicineId(updatedInventory.getMedicineId());
    existing.setSupplierId(updatedInventory.getSupplierId());
    existing.setBatchNumber(updatedInventory.getBatchNumber().trim());
    existing.setQuantity(updatedInventory.getQuantity());
    existing.setMinimumStock(updatedInventory.getMinimumStock());
    existing.setUnitPrice(updatedInventory.getUnitPrice());
    existing.setManufacturingDate(updatedInventory.getManufacturingDate());
    existing.setExpiryDate(updatedInventory.getExpiryDate());

    return inventoryRepository.save(existing);
}

// Validate manufacturing and expiry dates
private void validateInventoryDates(Inventory inventory) {

    if (inventory.getManufacturingDate() != null
            && inventory.getExpiryDate() != null
            && inventory.getExpiryDate().isBefore(
                    inventory.getManufacturingDate())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Expiry date cannot be before manufacturing date"
        );
    }
}

// ================= DELETE INVENTORY =================

public void deleteInventory(Long id) {

    Inventory existing = inventoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Inventory batch not found with ID: " + id
            ));

    inventoryRepository.delete(existing);
}



    // Get all inventory batches
    public List<Inventory> getInventory() {
        return inventoryRepository.findAll();
    }

    // Get batches that have reached the low-stock threshold
    public List<Inventory> getLowStock() {
        return inventoryRepository.findLowStockItems();
    }

    // Get batches expiring today through the next 30 days
    public List<Inventory> getExpiringSoon() {
        LocalDate today = LocalDate.now();

        return inventoryRepository
                .findExpiringByDate(today.plusDays(30))
                .stream()
                .filter(i -> !i.getExpiryDate().isBefore(today))
                .toList();
    }

    // Get batches that expired before today
    public List<Inventory> getExpiredInventory() {
        return inventoryRepository.findExpiringByDate(
                LocalDate.now().minusDays(1)
        );
    }


    
    // Stock monitoring summary
    public Map<String, Object> getStockMonitoring() {
        LocalDate today = LocalDate.now();
        LocalDate expiryLimit = today.plusDays(30);

        List<Inventory> inventory = inventoryRepository.findAll();

        long totalBatches = inventory.size();

        long totalStockUnits = inventory.stream()
                .mapToLong(i -> i.getQuantity() == null
                        ? 0 : i.getQuantity())
                .sum();

        long lowStockBatches = inventoryRepository
                .findLowStockItems().size();

        long outOfStockBatches = inventory.stream()
                .filter(i -> i.getQuantity() != null)
                .filter(i -> i.getQuantity() <= 0)
                .count();

        long expiredBatches = inventory.stream()
                .filter(i -> i.getExpiryDate() != null)
                .filter(i -> i.getExpiryDate().isBefore(today))
                .count();

        long expiringSoonBatches = inventory.stream()
                .filter(i -> i.getExpiryDate() != null)
                .filter(i -> !i.getExpiryDate().isBefore(today))
                .filter(i -> !i.getExpiryDate().isAfter(expiryLimit))
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalBatches", totalBatches);
        result.put("totalStockUnits", totalStockUnits);
        result.put("lowStockBatches", lowStockBatches);
        result.put("outOfStockBatches", outOfStockBatches);
        result.put("expiredBatches", expiredBatches);
        result.put("expiringSoonBatches", expiringSoonBatches);

        return result;
    }

    // Get active suppliers for the dropdown
public List<Supplier> getSuppliers() {
    return supplierRepository.findAll();
}

    // Add a new supplier
    public Supplier addSupplier(Supplier supplier) {
        if (supplier.getSupplierName() == null
                || supplier.getSupplierName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Supplier name is required"
            );
        }

        if (supplier.getSupplierName().trim().length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Supplier name is too long"
            );
        }

        Supplier newSupplier = new Supplier();
        newSupplier.setSupplierName(supplier.getSupplierName().trim());
        String contact = supplier.getContactNumber() != null && !supplier.getContactNumber().isBlank()
                ? supplier.getContactNumber().trim()
                : (supplier.getPhone() != null ? supplier.getPhone().trim() : "");
        newSupplier.setContactNumber(contact);
        newSupplier.setEmail(supplier.getEmail() != null ? supplier.getEmail().trim() : null);
        newSupplier.setAddress(supplier.getAddress() != null ? supplier.getAddress().trim() : null);
        newSupplier.setActive(true);

        return supplierRepository.save(newSupplier);
}

    
    // ================= PROFILE =================

    // Get the authenticated user's profile
    public ProfileResponse getProfile(String authenticatedEmail) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User profile not found"
                ));

        return new ProfileResponse(
                user.getFullName(),
                user.getEmail(),
                user.getPhone()
        );
    }

    // Update the authenticated user's profile
    public ProfileResponse updateProfile(
            String authenticatedEmail,
            ProfileRequest request) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Profile data is required"
            );
        }

        if (request.getFullName() == null
                || request.getFullName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name is required"
            );
        }

        if (request.getEmail() == null
                || request.getEmail().isBlank()
                || !request.getEmail().trim()
                        .matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please enter a valid email address"
            );
        }

        String fullName = request.getFullName().trim();
        String email = request.getEmail().trim();
        String phone = request.getPhone() == null
                ? ""
                : request.getPhone().trim();

        if (fullName.length() > 100
                || email.length() > 150
                || phone.length() > 30) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "One or more profile fields exceed the allowed length"
            );
        }

        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User profile not found"
                ));

        userRepository.findByEmail(email).ifPresent(existingUser -> {
            if (!existingUser.getUserId().equals(user.getUserId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "This email is already registered"
                );
            }
        });

        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone.isEmpty() ? null : phone);

        User savedUser = userRepository.save(user);

        return new ProfileResponse(
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone()
        );
    }


}
