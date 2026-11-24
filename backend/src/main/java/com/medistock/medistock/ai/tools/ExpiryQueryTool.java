package com.medistock.medistock.ai.tools;

import com.medistock.medistock.dto.FefoBatchDto;
import com.medistock.medistock.service.FefoService;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ExpiryQueryTool {

    private final FefoService fefoService;

    public ExpiryQueryTool(FefoService fefoService) {
        this.fefoService = fefoService;
    }

    public List<Map<String, Object>> getExpiringBatches(Integer daysThreshold) {
        int threshold = (daysThreshold != null && daysThreshold > 0) ? daysThreshold : 30;
        String filter = threshold <= 7 ? "CRITICAL_7" : (threshold <= 30 ? "NEAR_30" : (threshold <= 60 ? "MODERATE_60" : "WARNING_90"));

        List<FefoBatchDto> batches = fefoService.getBatchesWithFefo(null, null, filter);
        List<Map<String, Object>> items = new ArrayList<>();

        for (FefoBatchDto b : batches) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("batchId", b.getBatchId());
            map.put("batchNumber", b.getBatchNumber());
            map.put("medicineName", b.getMedicineName());
            map.put("quantityAvailable", b.getQuantityAvailable());
            map.put("expiryDate", b.getExpiryDate());
            map.put("daysUntilExpiry", b.getDaysUntilExpiry());
            map.put("fefoRecommendation", b.getFefoRecommendation());
            map.put("status", b.getStatus());
            items.add(map);
        }

        return items;
    }
}

