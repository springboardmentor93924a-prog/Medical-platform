package com.medistock.service.impl;

import com.medistock.dto.request.WastageRequest;
import com.medistock.dto.request.WastageReviewRequest;
import com.medistock.entity.*;
import com.medistock.enums.MovementType;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.enums.WastageStatus;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.*;
import com.medistock.service.AuditLogService;
import com.medistock.service.NotificationService;
import com.medistock.service.WastageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WastageServiceImpl implements WastageService {

    private final WastageReportRepository wastageReportRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public WastageServiceImpl(WastageReportRepository wastageReportRepository,
                              MedicineRepository medicineRepository,
                              UserRepository userRepository,
                              StockMovementRepository stockMovementRepository,
                              NotificationService notificationService,
                              AuditLogService auditLogService) {
        this.wastageReportRepository = wastageReportRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public WastageReport reportWastage(WastageRequest request, String userEmail) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with ID: " + request.getMedicineId()));

        User reporter = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        BigDecimal totalLoss = medicine.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantityWasted()));

        WastageReport report = new WastageReport();
        report.setMedicine(medicine);
        report.setBatchNumber(medicine.getBatchNumber());
        report.setCategory(medicine.getCategory());
        report.setSupplier(medicine.getSupplier());
        report.setQuantityWasted(request.getQuantityWasted());
        report.setUnitPrice(medicine.getUnitPrice());
        report.setTotalLoss(totalLoss);
        report.setReason(request.getReason());
        report.setDescription(request.getDescription());
        report.setStatus(WastageStatus.PENDING);
        report.setReportedBy(reporter);

        WastageReport saved = wastageReportRepository.save(report);

        // Notify Admins and Pharmacists
        notificationService.sendNotification(
                null,
                Role.ADMIN,
                "Wastage Reported: " + medicine.getName(),
                "A wastage report for " + request.getQuantityWasted() + " units of " + medicine.getName() + " (" + request.getReason() + ") was submitted by " + reporter.getFullName() + " and requires review.",
                NotificationType.SYSTEM
        );

        auditLogService.log(userEmail, reporter.getRole().name(), "REPORT_WASTAGE", "WastageReport", saved.getId().toString(),
                "Reported wastage of " + request.getQuantityWasted() + " units of " + medicine.getName() + " due to " + request.getReason());

        return saved;
    }

    @Override
    @Transactional
    public WastageReport reviewWastage(Long id, WastageReviewRequest request, String adminEmail) {
        WastageReport report = wastageReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wastage report not found with ID: " + id));

        if (report.getStatus() != WastageStatus.PENDING) {
            throw new BadRequestException("Wastage report #" + id + " has already been reviewed (Current status: " + report.getStatus() + "). Duplicate stock deductions are prohibited.");
        }

        User reviewer = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with email: " + adminEmail));

        String action = request.getAction().toUpperCase().trim();
        report.setReviewedBy(reviewer);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewNotes(request.getReviewNotes());

        if ("APPROVE".equals(action)) {
            Medicine medicine = report.getMedicine();
            if (medicine.getQuantity() < report.getQuantityWasted()) {
                throw new BadRequestException("Cannot approve wastage: Requested deduction (" + report.getQuantityWasted() + ") exceeds available medicine stock (" + medicine.getQuantity() + ").");
            }

            // Deduct stock exactly once
            medicine.setQuantity(medicine.getQuantity() - report.getQuantityWasted());
            medicineRepository.save(medicine);

            // Record official disposal movement
            StockMovement movement = new StockMovement(
                    medicine,
                    MovementType.DISPOSAL,
                    report.getQuantityWasted(),
                    "Wastage Approved: " + report.getReason() + " (Report #" + report.getId() + ") - " + (report.getDescription() != null ? report.getDescription() : "No details"),
                    report.getBatchNumber(),
                    reviewer
            );
            stockMovementRepository.save(movement);

            report.setStatus(WastageStatus.APPROVED);

            auditLogService.log(adminEmail, reviewer.getRole().name(), "APPROVE_WASTAGE", "WastageReport", report.getId().toString(),
                    "Approved wastage of " + report.getQuantityWasted() + " units of " + medicine.getName() + " with stock deduction");

            notificationService.sendNotification(
                    report.getReportedBy(),
                    null,
                    "Wastage Report Approved",
                    "Your wastage report #" + report.getId() + " for " + medicine.getName() + " (" + report.getQuantityWasted() + " units) has been approved by " + reviewer.getFullName() + ".",
                    NotificationType.SYSTEM
            );
        } else if ("REJECT".equals(action)) {
            report.setStatus(WastageStatus.REJECTED);

            auditLogService.log(adminEmail, reviewer.getRole().name(), "REJECT_WASTAGE", "WastageReport", report.getId().toString(),
                    "Rejected wastage report #" + report.getId() + ": " + request.getReviewNotes());

            notificationService.sendNotification(
                    report.getReportedBy(),
                    null,
                    "Wastage Report Rejected",
                    "Your wastage report #" + report.getId() + " for " + report.getMedicine().getName() + " was rejected. Reason: " + request.getReviewNotes(),
                    NotificationType.SYSTEM
            );
        } else {
            throw new BadRequestException("Invalid review action: " + action + ". Permitted values are 'APPROVE' or 'REJECT'.");
        }

        return wastageReportRepository.save(report);
    }

    @Override
    public Page<WastageReport> getAllReports(WastageStatus status, Long medicineId, Pageable pageable) {
        return wastageReportRepository.filterReports(status, medicineId, pageable);
    }

    @Override
    public Page<WastageReport> getMyReports(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        return wastageReportRepository.findByReportedById(user.getId(), pageable);
    }

    @Override
    public WastageReport getReportById(Long id) {
        return wastageReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wastage report not found with ID: " + id));
    }

    @Override
    public Map<String, Object> getWastageStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPendingReports", wastageReportRepository.countByStatus(WastageStatus.PENDING));
        stats.put("totalApprovedReports", wastageReportRepository.countByStatus(WastageStatus.APPROVED));
        stats.put("totalRejectedReports", wastageReportRepository.countByStatus(WastageStatus.REJECTED));
        stats.put("totalFinancialLoss", wastageReportRepository.calculateTotalApprovedLoss());
        stats.put("totalQuantityWasted", wastageReportRepository.calculateTotalApprovedQuantity());
        return stats;
    }
}
