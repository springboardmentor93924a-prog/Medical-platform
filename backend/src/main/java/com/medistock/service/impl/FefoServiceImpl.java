package com.medistock.service.impl;

import com.medistock.dto.request.FefoOverrideRequest;
import com.medistock.entity.FefoOverride;
import com.medistock.entity.Medicine;
import com.medistock.entity.User;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.FefoOverrideRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.FefoService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FefoServiceImpl implements FefoService {

    private final MedicineRepository medicineRepository;
    private final FefoOverrideRepository fefoOverrideRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public FefoServiceImpl(MedicineRepository medicineRepository,
                           FefoOverrideRepository fefoOverrideRepository,
                           UserRepository userRepository,
                           AuditLogService auditLogService) {
        this.medicineRepository = medicineRepository;
        this.fefoOverrideRepository = fefoOverrideRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public List<Medicine> getFefoRecommendations() {
        LocalDate today = LocalDate.now();
        List<Medicine> all = medicineRepository.findAll();

        return all.stream()
                .filter(m -> m.getQuantity() != null && m.getQuantity() > 0)
                .filter(m -> m.getExpiryDate() != null && !m.getExpiryDate().isBefore(today))
                .sorted(Comparator.comparing(Medicine::getExpiryDate))
                .limit(30)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> validateFefoIssuing(Long requestedMedicineId, Integer quantity) {
        Medicine requested = medicineRepository.findById(requestedMedicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + requestedMedicineId));

        LocalDate today = LocalDate.now();
        List<Medicine> all = medicineRepository.findAll();

        // Check if there is an earlier expiring active batch of the same genericName or brand name
        Optional<Medicine> earlierBatch = all.stream()
                .filter(m -> !m.getId().equals(requested.getId()))
                .filter(m -> (requested.getGenericName() != null && requested.getGenericName().equalsIgnoreCase(m.getGenericName())) ||
                             requested.getName().equalsIgnoreCase(m.getName()))
                .filter(m -> m.getQuantity() != null && m.getQuantity() > 0)
                .filter(m -> m.getExpiryDate() != null && !m.getExpiryDate().isBefore(today))
                .filter(m -> m.getExpiryDate().isBefore(requested.getExpiryDate()))
                .min(Comparator.comparing(Medicine::getExpiryDate));

        Map<String, Object> result = new HashMap<>();
        if (earlierBatch.isPresent()) {
            Medicine earlier = earlierBatch.get();
            result.put("fefoCompliant", false);
            result.put("warning", "FEFO Warning: Batch '" + earlier.getBatchNumber() + "' of " + earlier.getName() + " expires on " + earlier.getExpiryDate() + ", earlier than selected batch '" + requested.getBatchNumber() + "' (" + requested.getExpiryDate() + "). Priority must be given to earlier expiring stock.");
            result.put("recommendedMedicineId", earlier.getId());
            result.put("recommendedBatch", earlier.getBatchNumber());
            result.put("recommendedExpiryDate", earlier.getExpiryDate());
            result.put("recommendedAvailableQuantity", earlier.getQuantity());
        } else {
            result.put("fefoCompliant", true);
            result.put("message", "Compliant with FEFO protocol. Batch '" + requested.getBatchNumber() + "' is the earliest available expiring stock.");
        }
        return result;
    }

    @Override
    @Transactional
    public FefoOverride recordOverride(FefoOverrideRequest request, String userEmail) {
        Medicine requested = medicineRepository.findById(request.getRequestedMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Requested medicine not found"));
        Medicine recommended = medicineRepository.findById(request.getRecommendedMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Recommended medicine not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        FefoOverride override = new FefoOverride(requested, recommended, user, request.getQuantity(), request.getOverrideReason());
        FefoOverride saved = fefoOverrideRepository.save(override);

        String recordId = saved.getId() != null ? saved.getId().toString() : UUID.randomUUID().toString();
        auditLogService.log(userEmail, user.getRole().name(), "FEFO_OVERRIDE", "FefoOverride", recordId,
                "FEFO Override: Issued later batch '" + requested.getBatchNumber() + "' (" + requested.getExpiryDate() + ") over '" + recommended.getBatchNumber() + "' (" + recommended.getExpiryDate() + "). Reason: " + request.getOverrideReason());

        return saved;
    }

    @Override
    public Map<String, Object> getFefoComplianceStats() {
        long totalOverrides = fefoOverrideRepository.count();
        LocalDate today = LocalDate.now();
        List<Medicine> all = medicineRepository.findAll();

        long monitoredBatches = all.stream()
                .filter(m -> m.getQuantity() != null && m.getQuantity() > 0 && m.getExpiryDate() != null)
                .count();

        long nearExpiryCount = all.stream()
                .filter(m -> m.getQuantity() != null && m.getQuantity() > 0 && m.getExpiryDate() != null)
                .filter(m -> !m.getExpiryDate().isBefore(today) && m.getExpiryDate().isBefore(today.plusDays(60)))
                .count();

        // Estimated compliance rate percentage
        double complianceScore = monitoredBatches > 0
                ? Math.max(85.0, 100.0 - (totalOverrides * 2.5))
                : 100.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOverrides", totalOverrides);
        stats.put("monitoredBatches", monitoredBatches);
        stats.put("nearExpiryPriorityCount", nearExpiryCount);
        stats.put("complianceRate", Math.round(complianceScore * 10.0) / 10.0);
        return stats;
    }

    @Override
    public Page<FefoOverride> getOverrideHistory(Pageable pageable) {
        return fefoOverrideRepository.findAll(pageable);
    }
}
