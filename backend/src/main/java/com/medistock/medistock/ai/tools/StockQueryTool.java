package com.medistock.medistock.ai.tools;

import com.medistock.medistock.ai.reorder.ReorderCalculationService;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;

@Component
public class StockQueryTool {

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final ReorderCalculationService reorderCalculationService;

    @Autowired
    public StockQueryTool(
            MedicineRepository medicineRepository,
            InventoryBatchRepository inventoryBatchRepository,
            ReorderCalculationService reorderCalculationService) {
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.reorderCalculationService = reorderCalculationService;
    }

    public StockQueryTool(
            MedicineRepository medicineRepository,
            InventoryBatchRepository inventoryBatchRepository) {
        this(medicineRepository, inventoryBatchRepository, null);
    }

    public Map<String, Object> getMedicineStock(Integer medicineId) {
        Medicine med = medicineRepository.findById(medicineId).orElse(null);
        if (med == null) {
            return Map.of("found", false, "error", "Medicine not found with ID: " + medicineId);
        }

        LocalDate today = LocalDate.now();
        List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(medicineId);

        int totalUnits = 0;
        int usableUnits = 0;
        int expiredUnits = 0;

        for (InventoryBatch b : batches) {
            int qty = (b.getQuantityAvailable() != null) ? b.getQuantityAvailable() : 0;
            totalUnits += qty;
            String st = b.getStatus() != null ? b.getStatus().toUpperCase() : "ACTIVE";
            boolean isExpired = (b.getExpiryDate() != null && b.getExpiryDate().isBefore(today)) || "EXPIRED".equals(st);

            if (isExpired) {
                expiredUnits += qty;
            } else if (!"QUARANTINED".equals(st) && !"RECALLED".equals(st) && qty > 0) {
                usableUnits += qty;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("found", true);
        result.put("medicineId", med.getMedicineId());
        result.put("medicineName", med.getMedicineName());
        result.put("genericName", med.getGenericName());
        result.put("dosageForm", med.getDosageForm());
        result.put("strength", med.getStrength());
        result.put("totalBatches", batches.size());
        result.put("usableUnitsOnHand", usableUnits);
        result.put("expiredUnitsOnHand", expiredUnits);
        result.put("totalStock", totalUnits);

        if (reorderCalculationService != null) {
            try {
                var plan = reorderCalculationService.calculateForMedicine(medicineId);
                result.put("minStockAlert", plan.safetyStock());
                result.put("reorderPoint", plan.reorderPoint());
                result.put("averageDailyUsage", plan.averageDailyUsage());
                result.put("reorderTriggered", plan.reorderTriggered());
                result.put("reorderUrgency", plan.urgency());
            } catch (Exception e) {
                result.put("minStockAlert", 50);
                result.put("reorderPoint", 100);
            }
        } else {
            result.put("minStockAlert", 50);
            result.put("reorderPoint", 100);
        }

        return result;
    }

    public List<Map<String, Object>> getLowStockMedicines() {
        LocalDate today = LocalDate.now();
        List<Medicine> medicines = medicineRepository.findAll();
        List<Map<String, Object>> lowStockList = new ArrayList<>();

        for (Medicine med : medicines) {
            List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(med.getMedicineId());
            int usable = batches.stream()
                    .filter(b -> b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0)
                    .filter(b -> b.getExpiryDate() == null || !b.getExpiryDate().isBefore(today))
                    .filter(b -> {
                        String st = b.getStatus() != null ? b.getStatus().toUpperCase() : "ACTIVE";
                        return !"EXPIRED".equals(st) && !"QUARANTINED".equals(st) && !"RECALLED".equals(st);
                    })
                    .mapToInt(InventoryBatch::getQuantityAvailable)
                    .sum();

            int threshold = 50;
            String urgency = usable == 0 ? "OUT_OF_STOCK" : "CRITICAL_LOW";
            int suggestedOrderQty = 100;
            double adu = 0.0;

            if (reorderCalculationService != null) {
                try {
                    var plan = reorderCalculationService.calculateForMedicine(med.getMedicineId());
                    threshold = plan.reorderPoint();
                    urgency = plan.urgency();
                    suggestedOrderQty = plan.suggestedOrderQuantity();
                    adu = plan.averageDailyUsage();
                } catch (Exception ignored) {}
            }

            if (usable <= threshold || "STOCKOUT_IMMINENT".equals(urgency) || "CRITICAL_SHORTAGE".equals(urgency)) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("medicineId", med.getMedicineId());
                item.put("medicineName", med.getMedicineName());
                item.put("usableStock", usable);
                item.put("reorderPointThreshold", threshold);
                item.put("averageDailyUsage", adu);
                item.put("suggestedReorderQuantity", suggestedOrderQty);
                item.put("status", urgency);
                lowStockList.add(item);
            }
        }

        return lowStockList;
    }
}
