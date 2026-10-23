package com.medistock.medistock_backend.service;

import com.medistock.medistock_backend.dto.MedicineRequest;
import com.medistock.medistock_backend.dto.MedicineResponse;
import com.medistock.medistock_backend.entity.*;
import com.medistock.medistock_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final StockLogRepository stockLogRepository;

    // Get all medicines
    public List<MedicineResponse> getAllMedicines() {
        return medicineRepository.findAll().stream()
                .map(MedicineResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Add new medicine
    public MedicineResponse addMedicine(MedicineRequest req, User currentUser) {
        Medicine med = new Medicine();
        mapRequestToEntity(req, med);

        Medicine saved = medicineRepository.save(med);
        logStockChange(saved, saved.getQuantity(), "New Stock Added", currentUser);
        return MedicineResponse.fromEntity(saved);
    }

    // Update existing medicine
    public MedicineResponse updateMedicine(Long id, MedicineRequest req, User currentUser) {
        Medicine med = medicineRepository.findById(id).orElseThrow();
        int oldQuantity = med.getQuantity();

        mapRequestToEntity(req, med);
        med.setUpdatedAt(LocalDateTime.now());

        Medicine saved = medicineRepository.save(med);

        // If quantity changed, log it!
        int diff = saved.getQuantity() - oldQuantity;
        if (diff != 0) {
            logStockChange(saved, diff, "Inventory Update", currentUser);
        }
        return MedicineResponse.fromEntity(saved);
    }

    // Delete medicine
    public void deleteMedicine(Long id) {
        medicineRepository.deleteById(id);
    }

    private void mapRequestToEntity(MedicineRequest req, Medicine med) {
        med.setName(req.getName());
        med.setBatchNumber(req.getBatchNumber());
        med.setCategory(req.getCategory());
        med.setQuantity(req.getQuantity());
        med.setMinQuantity(req.getMinQuantity() != null ? req.getMinQuantity() : 10);
        med.setManufacturingDate(req.getManufacturingDate());
        med.setExpiryDate(req.getExpiryDate());
        med.setUnitPrice(req.getUnitPrice() != null ? req.getUnitPrice() : 0.0);

        if (req.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(req.getSupplierId()).orElse(null);
            med.setSupplier(supplier);
        }
    }

    private void logStockChange(Medicine med, int change, String reason, User user) {
        StockLog log = new StockLog();
        log.setMedicine(med);
        log.setChangeAmount(change);
        log.setReason(reason);
        log.setPerformedBy(user);
        stockLogRepository.save(log);
    }

    // Adjust stock directly (+ or -)
    public MedicineResponse adjustStock(Long id, int delta, User currentUser) {
        Medicine med = medicineRepository.findById(id).orElseThrow();

        int newQuantity = med.getQuantity() + delta;
        if (newQuantity < 0) newQuantity = 0; // Prevent negative stock

        med.setQuantity(newQuantity);
        med.setUpdatedAt(LocalDateTime.now());

        Medicine saved = medicineRepository.save(med);

        // Log the exact change (e.g., "+5" or "-2")
        String reason = delta > 0 ? "Manual Stock Addition" : "Manual Stock Deduction";
        logStockChange(saved, delta, reason, currentUser);

        return MedicineResponse.fromEntity(saved);
    }
}