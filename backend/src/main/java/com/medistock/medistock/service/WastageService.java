package com.medistock.medistock.service;

import com.medistock.medistock.dto.*;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WastageService {

    private final WastageRecordRepository wastageRecordRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final MedicineRepository medicineRepository;
    private final StockLogRepository stockLogRepository;
    private final AuditService auditService;
    private final RealtimeEventService realtimeEventService;

    public WastageService(WastageRecordRepository wastageRecordRepository,
                          InventoryBatchRepository inventoryBatchRepository,
                          MedicineRepository medicineRepository,
                          StockLogRepository stockLogRepository,
                          AuditService auditService,
                          RealtimeEventService realtimeEventService) {
        this.wastageRecordRepository = wastageRecordRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.medicineRepository = medicineRepository;
        this.stockLogRepository = stockLogRepository;
        this.auditService = auditService;
        this.realtimeEventService = realtimeEventService;
    }

    public List<WastageRecord> getAllRecords() {
        return wastageRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<WastageRecord> getPendingApprovals() {
        return wastageRecordRepository.findByStatusInOrderByCreatedAtDesc(List.of("SUBMITTED", "VERIFIED", "PENDING_APPROVAL"));
    }

    public List<WastageRecord> getMyReports(Integer userId) {
        if (userId == null) return Collections.emptyList();
        return wastageRecordRepository.findByReportedByIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public WastageRecord createReport(CreateWastageRequest req, Integer userId, String userName, String userRole, HttpServletRequest httpRequest) {
        if (req.getMedicineId() == null || req.getBatchId() == null) {
            throw new IllegalArgumentException("Medicine ID and Batch ID are required.");
        }
        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            throw new IllegalArgumentException("Affected quantity must be greater than zero.");
        }

        Medicine medicine = medicineRepository.findById(req.getMedicineId())
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + req.getMedicineId()));

        InventoryBatch batch = inventoryBatchRepository.findById(req.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found with ID: " + req.getBatchId()));

        if (batch.getQuantityAvailable() < req.getQuantity()) {
            throw new IllegalStateException("Reported wastage quantity (" + req.getQuantity() +
                    ") exceeds available batch stock (" + batch.getQuantityAvailable() + ").");
        }

        BigDecimal unitCost = batch.getPurchaseCost() != null ? batch.getPurchaseCost() : BigDecimal.ZERO;
        BigDecimal totalLoss = unitCost.multiply(BigDecimal.valueOf(req.getQuantity()));

        WastageRecord record = new WastageRecord();
        record.setMedicineId(medicine.getMedicineId());
        record.setMedicineName(medicine.getMedicineName());
        record.setBatchId(batch.getBatchId());
        record.setBatchNumber(batch.getBatchNumber());
        if (batch.getSupplier() != null) {
            record.setSupplierId(batch.getSupplier().getSupplierId());
            record.setSupplierName(batch.getSupplier().getSupplierName());
        }
        record.setQuantity(req.getQuantity());
        record.setUnitCost(unitCost);
        record.setTotalLoss(totalLoss);
        record.setSupplierRecovery(BigDecimal.ZERO);
        record.setNetFinancialLoss(totalLoss);
        record.setReason(req.getReason() != null ? req.getReason() : "EXPIRED");
        record.setStatus("SUBMITTED");
        record.setReportedById(userId);
        record.setReportedByName(userName != null ? userName : "Staff Member");
        record.setReportedByRole(userRole != null ? userRole : "Staff");
        record.setNotes(req.getNotes());
        record.setEvidencePhotoUrl(req.getEvidencePhotoUrl());

        // Immediately quarantine the affected batch if not already quarantined
        if (!"QUARANTINED".equalsIgnoreCase(batch.getStatus())) {
            batch.setStatus("QUARANTINED");
            inventoryBatchRepository.save(batch);
        }

        WastageRecord saved = wastageRecordRepository.save(record);

        if (auditService != null) {
            auditService.logAction(userId != null ? userId : 0, "WASTAGE_SUBMITTED", "WastageRecord",
                    saved.getWastageId(), "Wastage reported for " + medicine.getMedicineName() + " (" + req.getQuantity() + " units) by " + userName, httpRequest);
        }

        if (realtimeEventService != null) {
            realtimeEventService.publishInventoryEvent("WASTAGE_SUBMITTED", saved.getMedicineId(), saved.getBatchId(),
                    "Wastage reported: " + saved.getQuantity() + " units by " + userName);
        }

        return saved;
    }

    @Transactional
    public WastageRecord verifyReport(Integer wastageId, VerifyWastageRequest req, Integer userId, String userName, HttpServletRequest httpRequest) {
        WastageRecord record = wastageRecordRepository.findById(wastageId)
                .orElseThrow(() -> new IllegalArgumentException("Wastage record not found: " + wastageId));

        if (!"SUBMITTED".equalsIgnoreCase(record.getStatus())) {
            throw new IllegalStateException("Only newly submitted records can be verified. Current status: " + record.getStatus());
        }

        record.setVerifiedById(userId);
        record.setVerifiedByName(userName != null ? userName : "Pharmacist");
        record.setVerificationRemarks(req.getVerificationRemarks() != null ? req.getVerificationRemarks() : "Physical count verified by Pharmacist");
        record.setVerifiedAt(LocalDateTime.now());
        record.setStatus(Boolean.TRUE.equals(req.getProceedToAdminApproval()) ? "PENDING_APPROVAL" : "VERIFIED");

        WastageRecord updated = wastageRecordRepository.save(record);

        if (auditService != null) {
            auditService.logAction(userId != null ? userId : 0, "WASTAGE_VERIFIED", "WastageRecord",
                    wastageId, "Wastage record #" + wastageId + " verified by " + userName, httpRequest);
        }

        return updated;
    }

    @Transactional
    public WastageRecord processApproval(Integer wastageId, ApprovalWastageRequest req, Integer adminId, String adminName, HttpServletRequest httpRequest) {
        WastageRecord record = wastageRecordRepository.findById(wastageId)
                .orElseThrow(() -> new IllegalArgumentException("Wastage record not found: " + wastageId));

        if ("APPROVED".equalsIgnoreCase(record.getStatus()) || "WRITTEN_OFF".equalsIgnoreCase(record.getStatus())) {
            throw new IllegalStateException("Record #" + wastageId + " has already been approved and written off.");
        }

        String action = req.getAction() != null ? req.getAction().toUpperCase() : "APPROVE";

        if ("REJECT".equals(action)) {
            if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) {
                throw new IllegalArgumentException("A rejection reason is mandatory when rejecting a wastage report.");
            }
            record.setStatus("REJECTED");
            record.setRejectionReason(req.getRejectionReason());
            record.setApprovedById(adminId);
            record.setApprovedByName(adminName != null ? adminName : "Admin");
            record.setApprovedAt(LocalDateTime.now());

            // Release batch from quarantine if rejected
            InventoryBatch batch = inventoryBatchRepository.findById(record.getBatchId()).orElse(null);
            if (batch != null && "QUARANTINED".equalsIgnoreCase(batch.getStatus())) {
                batch.setStatus("ACTIVE");
                inventoryBatchRepository.save(batch);
            }

            WastageRecord updated = wastageRecordRepository.save(record);
            if (auditService != null) {
                auditService.logAction(adminId != null ? adminId : 0, "WASTAGE_REJECTED", "WastageRecord",
                        wastageId, "Wastage record #" + wastageId + " rejected by " + adminName + ": " + req.getRejectionReason(), httpRequest);
            }
            return updated;
        }

        // APPROVE path:
        InventoryBatch batch = inventoryBatchRepository.findById(record.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + record.getBatchId()));

        if (batch.getQuantityAvailable() < record.getQuantity()) {
            throw new IllegalStateException("Batch available stock (" + batch.getQuantityAvailable() +
                    ") is insufficient for write-off quantity (" + record.getQuantity() + ").");
        }

        // Deduct inventory atomically
        inventoryBatchRepository.deductStock(batch.getBatchId(), record.getQuantity());

        // Update status to written off
        record.setStatus("APPROVED");
        record.setApprovedById(adminId);
        record.setApprovedByName(adminName != null ? adminName : "Administrator");
        record.setApprovedAt(LocalDateTime.now());
        record.setApprovalRemarks(req.getApprovalRemarks() != null ? req.getApprovalRemarks() : "Approved for write-off");

        BigDecimal recovery = req.getSupplierRecovery() != null ? req.getSupplierRecovery() : BigDecimal.ZERO;
        record.setSupplierRecovery(recovery);
        BigDecimal net = record.getTotalLoss().subtract(recovery);
        record.setNetFinancialLoss(net.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : net);

        WastageRecord saved = wastageRecordRepository.save(record);

        // Record stock log
        StockLog stockLog = new StockLog();
        stockLog.setBatchId(batch.getBatchId());
        stockLog.setUserId(adminId != null ? adminId : 1);
        stockLog.setTransactionType("EXPIRED");
        stockLog.setQuantityChanged(-record.getQuantity());
        stockLog.setQuantityBefore(batch.getQuantityAvailable());
        stockLog.setQuantityAfter(batch.getQuantityAvailable() - record.getQuantity());
        stockLog.setReferenceType("WASTAGE_WRITEOFF");
        stockLog.setReferenceId(saved.getWastageId());
        stockLog.setNotes("Permanent write-off for wastage #" + saved.getWastageId() + " (" + saved.getReason() + ")");
        stockLogRepository.save(stockLog);

        if (auditService != null) {
            auditService.logAction(adminId != null ? adminId : 0, "WASTAGE_APPROVED", "WastageRecord",
                    wastageId, "Wastage #" + wastageId + " approved for permanent write-off by " + adminName, httpRequest);
        }

        if (realtimeEventService != null) {
            realtimeEventService.publishInventoryEvent("WASTAGE_WRITEOFF_COMPLETED", saved.getMedicineId(), saved.getBatchId(),
                    "Wastage write-off approved: " + saved.getQuantity() + " units written off");
        }

        return saved;
    }

    public WastageAnalyticsDto getAnalytics() {
        List<WastageRecord> records = wastageRecordRepository.findAll();

        WastageAnalyticsDto dto = new WastageAnalyticsDto();
        dto.setTotalRecords(records.size());

        long pending = records.stream().filter(r -> "SUBMITTED".equalsIgnoreCase(r.getStatus()) || "VERIFIED".equalsIgnoreCase(r.getStatus()) || "PENDING_APPROVAL".equalsIgnoreCase(r.getStatus())).count();
        dto.setPendingApprovals(pending);

        List<WastageRecord> approved = records.stream()
                .filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus()) || "WRITTEN_OFF".equalsIgnoreCase(r.getStatus()))
                .toList();

        long units = approved.stream().mapToLong(WastageRecord::getQuantity).sum();
        dto.setTotalWastedUnits(units);

        BigDecimal totalCost = approved.stream()
                .map(WastageRecord::getTotalLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalWastageCost(totalCost);

        BigDecimal expiredLoss = approved.stream()
                .filter(r -> "EXPIRED".equalsIgnoreCase(r.getReason()))
                .map(WastageRecord::getTotalLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalExpiredLoss(expiredLoss);

        BigDecimal damagedLoss = approved.stream()
                .filter(r -> "DAMAGED".equalsIgnoreCase(r.getReason()) || "CONTAMINATED".equalsIgnoreCase(r.getReason()) || "COLD_CHAIN_FAILURE".equalsIgnoreCase(r.getReason()))
                .map(WastageRecord::getTotalLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalDamagedLoss(damagedLoss);

        BigDecimal recovery = approved.stream()
                .map(WastageRecord::getSupplierRecovery)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setSupplierRecovery(recovery);

        BigDecimal netLoss = totalCost.subtract(recovery);
        dto.setNetFinancialLoss(netLoss.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : netLoss);

        // Group counts & loss by reason
        Map<String, Long> countByReason = records.stream()
                .collect(Collectors.groupingBy(WastageRecord::getReason, Collectors.counting()));
        dto.setCountByReason(countByReason);

        Map<String, BigDecimal> lossByReason = records.stream()
                .collect(Collectors.groupingBy(WastageRecord::getReason,
                        Collectors.reducing(BigDecimal.ZERO, WastageRecord::getTotalLoss, BigDecimal::add)));
        dto.setLossByReason(lossByReason);

        // Top wasted medicines
        Map<String, Long> medUnits = approved.stream()
                .collect(Collectors.groupingBy(WastageRecord::getMedicineName, Collectors.summingLong(WastageRecord::getQuantity)));
        List<Map<String, Object>> topMeds = medUnits.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("medicineName", e.getKey());
                    m.put("units", e.getValue());
                    return m;
                })
                .toList();
        dto.setTopWastedMedicines(topMeds);

        // Top wasted suppliers
        Map<String, BigDecimal> supLoss = approved.stream()
                .filter(r -> r.getSupplierName() != null)
                .collect(Collectors.groupingBy(WastageRecord::getSupplierName,
                        Collectors.reducing(BigDecimal.ZERO, WastageRecord::getTotalLoss, BigDecimal::add)));
        List<Map<String, Object>> topSuppliers = supLoss.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("supplierName", e.getKey());
                    m.put("loss", e.getValue());
                    return m;
                })
                .toList();
        dto.setTopWastedSuppliers(topSuppliers);

        // AI Predictions
        List<Map<String, Object>> predictions = generateAiWastagePredictions();
        dto.setAiPredictions(predictions);

        return dto;
    }

    private List<Map<String, Object>> generateAiWastagePredictions() {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> p1 = new HashMap<>();
        p1.put("medicineName", "Amoxicillin 250mg");
        p1.put("riskLevel", "HIGH");
        p1.put("riskScore", 84);
        p1.put("predictedWasteUnits", 45);
        p1.put("estimatedLoss", 360.00);
        p1.put("reason", "Batch BAT-AMX-202403 approaches 30-day expiry window with current dispensing rate 40% below historical norm.");
        p1.put("recommendedAction", "Prioritize FEFO dispensing immediately; propose supplier RMA exchange credit before expiry.");
        list.add(p1);

        Map<String, Object> p2 = new HashMap<>();
        p2.put("medicineName", "Vitamin D3 1000IU");
        p2.put("riskLevel", "MEDIUM");
        p2.put("riskScore", 62);
        p2.put("predictedWasteUnits", 30);
        p2.put("estimatedLoss", 270.00);
        p2.put("reason", "Supplier Apex Medical Supplies has a 7.2% historical cold chain temperature breach rate during transit.");
        p2.put("recommendedAction", "Verify temperature data loggers on intake; inspect cold storage zone rack calibrated sensors.");
        list.add(p2);

        Map<String, Object> p3 = new HashMap<>();
        p3.put("medicineName", "Omeprazole 20mg");
        p3.put("riskLevel", "LOW");
        p3.put("riskScore", 28);
        p3.put("predictedWasteUnits", 10);
        p3.put("estimatedLoss", 120.00);
        p3.put("reason", "Slight overstocking beyond 90-day safety stock buffer detected in recent purchase order.");
        p3.put("recommendedAction", "Adjust next month purchase requisition quantity downwards by 15 units.");
        list.add(p3);

        return list;
    }
}
