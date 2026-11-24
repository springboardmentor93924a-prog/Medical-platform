package com.medistock.medistock.ai.tools;

import com.medistock.medistock.config.CacheConfig;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.repository.InventoryBatchRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Component
public class WastageQueryTool {

    private final InventoryBatchRepository inventoryBatchRepository;

    public WastageQueryTool(InventoryBatchRepository inventoryBatchRepository) {
        this.inventoryBatchRepository = inventoryBatchRepository;
    }

    @Cacheable(value = CacheConfig.CACHE_WASTAGE_LOSS)
    public Map<String, Object> getExpiredLossSummary() {
        LocalDate today = LocalDate.now();
        List<InventoryBatch> allBatches = inventoryBatchRepository.findAll();

        int expiredBatchesCount = 0;
        int totalExpiredUnits = 0;
        BigDecimal totalFinancialLoss = BigDecimal.ZERO;
        List<Map<String, Object>> expiredList = new ArrayList<>();

        for (InventoryBatch b : allBatches) {
            String st = b.getStatus() != null ? b.getStatus().toUpperCase() : "";
            boolean isExpired = (b.getExpiryDate() != null && b.getExpiryDate().isBefore(today)) || "EXPIRED".equals(st);

            if (isExpired && b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0) {
                expiredBatchesCount++;
                totalExpiredUnits += b.getQuantityAvailable();
                BigDecimal cost = (b.getPurchaseCost() != null) ? b.getPurchaseCost() : BigDecimal.valueOf(10.00);
                BigDecimal loss = cost.multiply(BigDecimal.valueOf(b.getQuantityAvailable())).setScale(2, RoundingMode.HALF_UP);
                totalFinancialLoss = totalFinancialLoss.add(loss);

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("batchId", b.getBatchId());
                item.put("batchNumber", b.getBatchNumber());
                item.put("medicineId", b.getMedicineId());
                item.put("expiredUnits", b.getQuantityAvailable());
                item.put("expiryDate", b.getExpiryDate());
                item.put("financialLoss", loss);
                expiredList.add(item);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalExpiredBatchesWithStock", expiredBatchesCount);
        result.put("totalExpiredUnitsOnHand", totalExpiredUnits);
        result.put("estimatedFinancialLoss", totalFinancialLoss);
        result.put("expiredBatches", expiredList);
        return result;
    }
}

