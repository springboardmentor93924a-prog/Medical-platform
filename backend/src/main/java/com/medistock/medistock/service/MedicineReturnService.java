package com.medistock.medistock.service;

import com.medistock.medistock.dto.returns.CreateReturnRequest;
import com.medistock.medistock.dto.returns.ResolveReturnRequest;
import com.medistock.medistock.dto.returns.ReturnAnalyticsDto;
import com.medistock.medistock.dto.returns.SubmitInspectionRequest;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class MedicineReturnService {

    private static final Logger log = LoggerFactory.getLogger(MedicineReturnService.class);

    private final MedicineReturnRepository returnRepository;
    private final ReturnInspectionRepository inspectionRepository;
    private final InventoryBatchRepository batchRepository;
    private final StockLogRepository stockLogRepository;
    private final UserRepository userRepository;
    private final WastageRecordRepository wastageRecordRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final EmailNotificationService emailNotificationService;

    public MedicineReturnService(MedicineReturnRepository returnRepository,
            ReturnInspectionRepository inspectionRepository,
            InventoryBatchRepository batchRepository,
            StockLogRepository stockLogRepository,
            UserRepository userRepository,
            WastageRecordRepository wastageRecordRepository,
            AuditService auditService,
            NotificationService notificationService,
            EmailNotificationService emailNotificationService) {
        this.returnRepository = returnRepository;
        this.inspectionRepository = inspectionRepository;
        this.batchRepository = batchRepository;
        this.stockLogRepository = stockLogRepository;
        this.userRepository = userRepository;
        this.wastageRecordRepository = wastageRecordRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
    }

    /**
     * Lists returns scoped to user role.
     */
    @Transactional(readOnly = true)
    public List<MedicineReturn> getReturnsForUser(Integer userId, String role, Integer supplierId) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return returnRepository.findAll(org.springframework.data.domain.Sort
                    .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        } else if ("SUPPLIER".equalsIgnoreCase(role)) {
            if (supplierId != null) {
                return returnRepository.findBySupplier_SupplierIdOrderByCreatedAtDesc(supplierId);
            }
            return Collections.emptyList();
        } else {
            // Pharmacist and Staff
            return returnRepository.findAll(org.springframework.data.domain.Sort
                    .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        }
    }

    @Transactional(readOnly = true)
    public MedicineReturn getReturnById(Integer returnId) {
        return returnRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine return record #" + returnId + " not found"));
    }

    @Transactional(readOnly = true)
    public List<ReturnInspection> getInspections(Integer returnId) {
        return inspectionRepository.findByMedicineReturn_ReturnIdOrderByInspectedAtDesc(returnId);
    }

    /**
     * CRITICAL SAFETY RULE:
     * Never automatically add returned medicines to usable inventory.
     * All newly initiated returns enter QUARANTINED state immediately.
     */
    @Transactional
    public MedicineReturn createReturn(CreateReturnRequest req, Integer userId, String role,
            HttpServletRequest httpRequest) {
        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        InventoryBatch batch = batchRepository.findById(req.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found: " + req.getBatchId()));

        Medicine medicine = batch.getMedicine();
        if (medicine == null) {
            throw new IllegalStateException("Batch #" + batch.getBatchId() + " has no linked medicine");
        }

        BigDecimal unitCost = batch.getPurchaseCost() != null ? batch.getPurchaseCost() : BigDecimal.ZERO;
        BigDecimal totalVal = unitCost.multiply(BigDecimal.valueOf(req.getQuantity()));

        String returnNumber = generateReturnNumber();

        MedicineReturn ret = new MedicineReturn();
        ret.setReturnNumber(returnNumber);
        ret.setReturnSource(req.getReturnSource().toUpperCase());
        ret.setBatch(batch);
        ret.setMedicine(medicine);
        ret.setSupplier(batch.getSupplier());
        ret.setQuantity(req.getQuantity());
        ret.setUnitCost(unitCost);
        ret.setTotalValue(totalVal);
        ret.setReturnReason(req.getReturnReason().toUpperCase());
        ret.setReasonDetails(req.getReasonDetails());
        ret.setStatus("QUARANTINED"); // Enforced quarantine state
        ret.setRequestedBy(requester);
        ret.setSourceRole(role != null ? role.toUpperCase() : "PHARMACIST");
        ret.setDepartment(req.getDepartment() != null ? req.getDepartment() : "General Pharmacy");

        MedicineReturn saved = returnRepository.save(ret);

        // Audit Trail
        auditService.logAction(
                userId,
                "CREATE_MEDICINE_RETURN",
                "MEDICINE_RETURN",
                saved.getReturnId(),
                "Initiated return " + saved.getReturnNumber() + " for " + saved.getQuantity() + " units of " +
                        medicine.getMedicineName() + " (Batch " + batch.getBatchNumber() + "). Status: QUARANTINED",
                httpRequest);

        // Record stock log transition
        StockLog stockLog = new StockLog();
        stockLog.setBatchId(batch.getBatchId());
        stockLog.setUserId(userId);
        stockLog.setTransactionType("RETURN_QUARANTINE");
        stockLog.setQuantityChanged(0); // Available usable stock is NOT changed
        stockLog.setQuantityBefore(batch.getQuantityAvailable());
        stockLog.setQuantityAfter(batch.getQuantityAvailable());
        stockLog.setReferenceType("MEDICINE_RETURN");
        stockLog.setReferenceId(saved.getReturnId());
        stockLog.setNotes(
                "Return " + saved.getReturnNumber() + " received into safety quarantine. Requires quality inspection.");
        stockLogRepository.save(stockLog);

        // In-App Notification to Admins
        notificationService.notifyAdmins(
                "New Medicine Return Quarantined",
                "Return #" + saved.getReturnNumber() + " (" + saved.getQuantity() + " units of "
                        + medicine.getMedicineName() + ") placed into safety quarantine pending inspection.",
                "RETURN_QUARANTINED",
                "MEDICINE_RETURN",
                saved.getReturnId(),
                "HIGH");

        // Asynchronous SMTP Alert
        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("message",
                    "A new medicine return request has been submitted and securely locked in isolation quarantine.");
            emailData.put("returnNumber", saved.getReturnNumber());
            emailData.put("medicineName", medicine.getMedicineName());
            emailData.put("batchNumber", batch.getBatchNumber());
            emailData.put("quantity", saved.getQuantity());
            emailData.put("reason", saved.getReturnReason());
            emailData.put("status", "QUARANTINED");

            List<User> admins = userRepository.findByRoleId(1);
            for (User admin : admins) {
                emailNotificationService.sendEmail(
                        "MEDICINE_RETURN_QUARANTINED",
                        admin.getUserId(),
                        admin.getEmail(),
                        admin.getFullName(),
                        "SAFETY ALERT: Medicine Return #" + saved.getReturnNumber() + " Placed in Quarantine",
                        "INVENTORY_ALERT",
                        emailData,
                        "HIGH",
                        "RET-QUARANTINE-" + saved.getReturnId(),
                        false);
            }
        } catch (Exception e) {
            log.warn("[MedicineReturnService] SMTP notification skipped: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Physical, Packaging, Temperature & Expiry Quality Inspection
     */
    @Transactional
    public ReturnInspection submitInspection(Integer returnId, SubmitInspectionRequest req, Integer inspectorId,
            HttpServletRequest httpRequest) {
        MedicineReturn ret = getReturnById(returnId);
        User inspector = userRepository.findById(inspectorId)
                .orElseThrow(() -> new IllegalArgumentException("Inspector user not found: " + inspectorId));

        ReturnInspection insp = new ReturnInspection();
        insp.setMedicineReturn(ret);
        insp.setInspector(inspector);
        insp.setInspectionType(req.getInspectionType().toUpperCase());
        insp.setPackagingIntact(req.getPackagingIntact());
        insp.setTemperatureMaintained(req.getTemperatureMaintained());
        insp.setBatchVerified(req.getBatchVerified());
        insp.setPassed(req.getPassed());
        insp.setFindings(req.getFindings());

        ReturnInspection saved = inspectionRepository.save(insp);

        ret.setInspectedBy(inspector);
        ret.setInspectedAt(LocalDateTime.now());
        ret.setInspectionNotes(req.getFindings());

        if (Boolean.TRUE.equals(req.getPassed())) {
            ret.setQualityStatus("PASSED_QUALITY_CHECK");
            ret.setStatus("APPROVED_FOR_RESTOCK");
        } else {
            ret.setQualityStatus("FAILED_DAMAGED");
            ret.setStatus("UNDER_INSPECTION");
        }
        returnRepository.save(ret);

        auditService.logAction(
                inspectorId,
                "INSPECT_MEDICINE_RETURN",
                "MEDICINE_RETURN",
                ret.getReturnId(),
                "Completed quality inspection for return " + ret.getReturnNumber() + ". Passed: " + req.getPassed()
                        + ". Findings: " + req.getFindings(),
                httpRequest);

        return saved;
    }

    /**
     * Authorized Final Resolution:
     * - RESTOCK_USABLE_INVENTORY: Adds to batch usable quantity after verified
     * quality pass
     * - DISPOSE_TO_WASTAGE: Automatic transition to Wastage calculation
     * - DISPATCH_TO_SUPPLIER_CREDIT: Vendor claim
     * - REJECT_RETURN: Denied
     */
    @Transactional
    public MedicineReturn resolveReturn(Integer returnId, ResolveReturnRequest req, Integer authorizerId,
            HttpServletRequest httpRequest) {
        MedicineReturn ret = getReturnById(returnId);
        User authorizer = userRepository.findById(authorizerId)
                .orElseThrow(() -> new IllegalArgumentException("Authorizer not found: " + authorizerId));

        String action = req.getResolutionAction().toUpperCase();
        ret.setApprovedBy(authorizer);
        ret.setApprovedAt(LocalDateTime.now());
        ret.setResolutionAction(action);

        InventoryBatch batch = ret.getBatch();
        Medicine medicine = ret.getMedicine();

        switch (action) {
            case "RESTOCK_USABLE_INVENTORY":
                if (!"PASSED_QUALITY_CHECK".equalsIgnoreCase(ret.getQualityStatus())) {
                    throw new IllegalStateException(
                            "Safety Violation: Cannot restock returned medicine that has not PASSED quality inspection.");
                }
                int beforeQty = batch.getQuantityAvailable();
                int afterQty = beforeQty + ret.getQuantity();
                batch.setQuantityAvailable(afterQty);
                batchRepository.save(batch);

                ret.setStatus("RESTOCKED");

                // Stock transaction ledger
                StockLog restockLog = new StockLog();
                restockLog.setBatchId(batch.getBatchId());
                restockLog.setUserId(authorizerId);
                restockLog.setTransactionType("STOCK_RETURN_RESTOCK");
                restockLog.setQuantityChanged(ret.getQuantity());
                restockLog.setQuantityBefore(beforeQty);
                restockLog.setQuantityAfter(afterQty);
                restockLog.setReferenceType("MEDICINE_RETURN");
                restockLog.setReferenceId(ret.getReturnId());
                restockLog.setNotes(
                        "Return " + ret.getReturnNumber() + " passed quality check. Restocked into active inventory.");
                stockLogRepository.save(restockLog);
                break;

            case "DISPOSE_TO_WASTAGE":
                ret.setStatus("TRANSFERRED_TO_WASTAGE");

                // Automatically forward to Wastage subsystem
                WastageRecord wastage = new WastageRecord();
                wastage.setBatchId(batch.getBatchId());
                wastage.setBatchNumber(batch.getBatchNumber());
                wastage.setMedicineId(medicine.getMedicineId());
                wastage.setMedicineName(medicine.getMedicineName());
                if (batch.getSupplier() != null) {
                    wastage.setSupplierId(batch.getSupplier().getSupplierId());
                    wastage.setSupplierName(batch.getSupplier().getSupplierName());
                }
                wastage.setQuantity(ret.getQuantity());
                wastage.setUnitCost(ret.getUnitCost());
                wastage.setTotalLoss(ret.getTotalValue());
                wastage.setNetFinancialLoss(ret.getTotalValue());
                wastage.setReason("DAMAGED");
                wastage.setStatus("PENDING_APPROVAL");
                wastage.setReportedById(authorizerId);
                wastage.setReportedByName(authorizer.getFullName());
                wastage.setReportedByRole("ADMIN");
                wastage.setNotes(
                        "Transferred from rejected return #" + ret.getReturnNumber() + ". Notes: " + req.getNotes());
                wastageRecordRepository.save(wastage);
                break;

            case "DISPATCH_TO_SUPPLIER_CREDIT":
                ret.setStatus("RETURNED_TO_SUPPLIER");

                // Notify Supplier via SMTP
                if (ret.getSupplier() != null) {
                    try {
                        Map<String, Object> supData = new HashMap<>();
                        supData.put("message",
                                "MediStock Pharmacy has issued a supplier return claim for damaged or non-conforming items.");
                        supData.put("poNumber", ret.getReturnNumber());
                        supData.put("totalAmount", ret.getTotalValue());
                        supData.put("expectedDelivery", "Awaiting RMA Dispatch");
                        supData.put("instructions",
                                "Credit note or batch replacement requested for Batch " + batch.getBatchNumber());

                        List<User> suppliers = userRepository.findByRoleId(4);
                        for (User s : suppliers) {
                            emailNotificationService.sendEmail(
                                    "SUPPLIER_RETURN_DISPATCH",
                                    s.getUserId(),
                                    s.getEmail(),
                                    s.getFullName(),
                                    "SUPPLIER RETURN CLAIM: " + ret.getReturnNumber() + " from MediStock",
                                    "SUPPLIER_DELIVERY",
                                    supData,
                                    "HIGH",
                                    "SUP-RET-" + ret.getReturnId(),
                                    false);
                        }
                    } catch (Exception ex) {
                        log.warn("[MedicineReturnService] Supplier SMTP alert failed: {}", ex.getMessage());
                    }
                }
                break;

            case "REJECT_RETURN":
            default:
                ret.setStatus("REJECTED");
                break;
        }

        MedicineReturn resolved = returnRepository.save(ret);

        auditService.logAction(
                authorizerId,
                "RESOLVE_MEDICINE_RETURN",
                "MEDICINE_RETURN",
                resolved.getReturnId(),
                "Resolved return " + resolved.getReturnNumber() + " with action: " + action + " (Status: "
                        + resolved.getStatus() + ")",
                httpRequest);

        return resolved;
    }

    /**
     * Analytics and KPIs across all returns.
     */
    @Transactional(readOnly = true)
    public ReturnAnalyticsDto getAnalytics() {
        ReturnAnalyticsDto dto = new ReturnAnalyticsDto();

        List<MedicineReturn> all = returnRepository.findAll();
        dto.setTotalReturns(all.size());

        long quarantined = all.stream().filter(r -> "QUARANTINED".equalsIgnoreCase(r.getStatus())).count();
        long inspection = all.stream().filter(r -> "UNDER_INSPECTION".equalsIgnoreCase(r.getStatus())).count();
        long restocked = all.stream().filter(r -> "RESTOCKED".equalsIgnoreCase(r.getStatus())).count();
        long supplierRet = all.stream().filter(r -> "RETURNED_TO_SUPPLIER".equalsIgnoreCase(r.getStatus())).count();
        long wastage = all.stream().filter(r -> "TRANSFERRED_TO_WASTAGE".equalsIgnoreCase(r.getStatus())).count();

        BigDecimal totalVal = all.stream()
                .map(r -> r.getTotalValue() != null ? r.getTotalValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        dto.setQuarantinedCount(quarantined);
        dto.setUnderInspectionCount(inspection);
        dto.setRestockedCount(restocked);
        dto.setSupplierReturnsCount(supplierRet);
        dto.setWastageDisposedCount(wastage);
        dto.setTotalReturnValue(totalVal);

        Map<String, Long> statusMap = new HashMap<>();
        for (Object[] row : returnRepository.countGroupedByStatus()) {
            if (row != null && row.length >= 2 && row[0] != null) {
                statusMap.put(String.valueOf(row[0]), (Long) row[1]);
            }
        }
        dto.setCountByStatus(statusMap);

        Map<String, Long> reasonMap = new HashMap<>();
        for (Object[] row : returnRepository.countGroupedByReason()) {
            if (row != null && row.length >= 2 && row[0] != null) {
                reasonMap.put(String.valueOf(row[0]), (Long) row[1]);
            }
        }
        dto.setCountByReason(reasonMap);

        return dto;
    }

    private synchronized String generateReturnNumber() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        long count = returnRepository.count() + 1;
        return String.format("RET-%s-%04d", year, count);
    }
}
