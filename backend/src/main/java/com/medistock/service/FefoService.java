package com.medistock.service;

import com.medistock.dto.request.FefoOverrideRequest;
import com.medistock.entity.FefoOverride;
import com.medistock.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface FefoService {
    List<Medicine> getFefoRecommendations();
    Map<String, Object> validateFefoIssuing(Long requestedMedicineId, Integer quantity);
    FefoOverride recordOverride(FefoOverrideRequest request, String userEmail);
    Map<String, Object> getFefoComplianceStats();
    Page<FefoOverride> getOverrideHistory(Pageable pageable);
}
