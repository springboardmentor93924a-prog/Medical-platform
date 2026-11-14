package com.medistock.service;

import com.medistock.dto.request.WastageRequest;
import com.medistock.dto.request.WastageReviewRequest;
import com.medistock.entity.WastageReport;
import com.medistock.enums.WastageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface WastageService {
    WastageReport reportWastage(WastageRequest request, String userEmail);
    WastageReport reviewWastage(Long id, WastageReviewRequest request, String adminEmail);
    Page<WastageReport> getAllReports(WastageStatus status, Long medicineId, Pageable pageable);
    Page<WastageReport> getMyReports(String userEmail, Pageable pageable);
    WastageReport getReportById(Long id);
    Map<String, Object> getWastageStats();
}
