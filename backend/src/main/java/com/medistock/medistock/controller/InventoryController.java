package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.DispenseStockRequest;
import com.medistock.medistock.dto.ReceiveStockRequest;
import com.medistock.medistock.dto.StockRequisitionRequest;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.*;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import com.medistock.medistock.service.NotificationService;
import com.medistock.medistock.service.RealtimeEventService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final MedicineRepository medicineRepository;
    private final StockLogRepository stockLogRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final StockDiscrepancyRepository stockDiscrepancyRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;
    private final RealtimeEventService realtimeEventService;
    private final NotificationService notificationService;

    public InventoryController(InventoryBatchRepository inventoryBatchRepository,
                               MedicineRepository medicineRepository,
                               StockLogRepository stockLogRepository,
                               StockAdjustmentRepository stockAdjustmentRepository,
                               StockDiscrepancyRepository stockDiscrepancyRepository,
                               TaskRepository taskRepository,
                               NotificationRepository notificationRepository,
                               AuditService auditService,
                               CurrentUserService currentUserService,
                               RealtimeEventService realtimeEventService,
                               NotificationService notificationService) {
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.medicineRepository = medicineRepository;
        this.stockLogRepository = stockLogRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.stockDiscrepancyRepository = stockDiscrepancyRepository;
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
        this.auditService = auditService;
        this.currentUserService = currentUserService;
        this.realtimeEventService = realtimeEventService;
        this.notificationService = notificationService;
    }

    @GetMapping("/batches")
    public ResponseEntity<ApiResponse<List<InventoryBatch>>> getBatches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer medicineId) {

        List<InventoryBatch> batches;
        if (medicineId != null) {
            batches = inventoryBatchRepository.findByMedicineId(medicineId);
        } else if (search != null && !search.isBlank()) {
            batches = inventoryBatchRepository.searchBatches(search.trim());
        } else {
            batches = inventoryBatchRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.ok(batches));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<InventoryBatch>>> getLowStockBatches(
            @RequestParam(defaultValue = "50") Integer threshold) {
        List<InventoryBatch> list = inventoryBatchRepository
                .findByQuantityAvailableLessThanEqualOrderByQuantityAvailableAsc(threshold);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<List<InventoryBatch>>> getExpiringBatches(
            @RequestParam(defaultValue = "60") Integer days) {
        LocalDate cutoff = LocalDate.now().plusDays(days);
        List<InventoryBatch> list = inventoryBatchRepository
                .findByExpiryDateLessThanEqualAndQuantityAvailableGreaterThanOrderByExpiryDateAsc(cutoff, 0);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/expiry-tracking")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getExpiryTracking(
            @RequestParam(required = false) String filter) {

        LocalDate today = LocalDate.now();
        List<InventoryBatch> batches = inventoryBatchRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (InventoryBatch b : batches) {
            if (b.getExpiryDate() == null) continue;

            long daysDiff = ChronoUnit.DAYS.between(today, b.getExpiryDate());
            String status;
            String badgeVariant;

            if (daysDiff < 0) {
                status = "EXPIRED";
                badgeVariant = "danger";
            } else if (daysDiff <= 7) {
                status = "CRITICAL";
                badgeVariant = "danger";
            } else if (daysDiff <= 30) {
                status = "EXPIRING_SOON";
                badgeVariant = "warning";
            } else if (daysDiff <= 90) {
                status = "EXPIRING_60_90";
                badgeVariant = "info";
            } else {
                status = "VALID";
                badgeVariant = "success";
            }

            if (filter != null && !filter.isBlank() && !filter.equalsIgnoreCase("ALL")) {
                if (!status.equalsIgnoreCase(filter.trim())) {
                    continue;
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("batchId", b.getBatchId());
            item.put("batchNumber", b.getBatchNumber());
            item.put("medicineId", b.getMedicineId());
            item.put("medicineName", b.getMedicine() != null ? b.getMedicine().getMedicineName() : "Unknown");
            item.put("categoryName", (b.getMedicine() != null && b.getMedicine().getCategory() != null)
                    ? b.getMedicine().getCategory().getCategoryName() : "General");
            item.put("supplierName", b.getSupplier() != null ? b.getSupplier().getSupplierName() : "Direct");
            item.put("quantityAvailable", b.getQuantityAvailable());
            item.put("quantityReceived", b.getQuantityReceived());
            item.put("expiryDate", b.getExpiryDate());
            item.put("manufacturingDate", b.getManufacturingDate());
            item.put("daysDifference", daysDiff);
            item.put("isOverdue", daysDiff < 0);
            item.put("daysLabel", daysDiff < 0 ? Math.abs(daysDiff) + " days overdue" : daysDiff + " days remaining");
            item.put("expiryStatus", status);
            item.put("badgeVariant", badgeVariant);
            result.add(item);
        }

        result.sort(Comparator.comparingLong(m -> (Long) m.get("daysDifference")));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @Transactional
    public ResponseEntity<ApiResponse<InventoryBatch>> adjustStock(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        if (!body.containsKey("batchId")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Batch ID is required"));
        }
        Integer batchId = ((Number) body.get("batchId")).intValue();

        if (!body.containsKey("quantityChanged")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Quantity changed is required"));
        }
        int qtyChanged = ((Number) body.get("quantityChanged")).intValue();

        String adjustmentType = body.containsKey("adjustmentType") ? body.get("adjustmentType").toString().toUpperCase() : "CORRECTION";
        String reason = body.containsKey("reason") ? body.get("reason").toString().trim() : "Stock adjustment";

        Optional<InventoryBatch> batchOpt = inventoryBatchRepository.findById(batchId);
        if (batchOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Batch not found"));
        }

        InventoryBatch batch = batchOpt.get();
        int qtyBefore = batch.getQuantityAvailable();
        int qtyAfter = qtyBefore + qtyChanged;

        if (qtyAfter < 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Cannot reduce stock below zero. Available: " + qtyBefore + ", Reduction requested: " + Math.abs(qtyChanged)));
        }

        batch.setQuantityAvailable(qtyAfter);
        InventoryBatch savedBatch = inventoryBatchRepository.save(batch);

        Integer userId = currentUserService.getCurrentUserId();

        StockAdjustment adj = new StockAdjustment();
        adj.setBatchId(savedBatch.getBatchId());
        adj.setUserId(userId != null ? userId : 1);
        adj.setAdjustmentType(adjustmentType);
        adj.setQuantityChanged(qtyChanged);
        adj.setReason(reason);
        stockAdjustmentRepository.save(adj);

        StockLog stockLog = new StockLog();
        stockLog.setBatchId(savedBatch.getBatchId());
        stockLog.setUserId(userId != null ? userId : 1);
        stockLog.setTransactionType(adjustmentType);
        stockLog.setQuantityChanged(qtyChanged);
        stockLog.setQuantityBefore(qtyBefore);
        stockLog.setQuantityAfter(qtyAfter);
        stockLog.setReferenceType("STOCK_ADJUSTMENT");
        stockLog.setNotes(reason);
        stockLogRepository.save(stockLog);

        String medName = batch.getMedicine() != null ? batch.getMedicine().getMedicineName() : "Batch #" + batch.getBatchNumber();
        auditService.logAction(
                userId,
                "STOCK_ADJUSTMENT",
                "BATCH",
                savedBatch.getBatchId(),
                "Stock adjusted (" + adjustmentType + "): " + qtyChanged + " units for " + medName + ". Reason: " + reason,
                request
        );

        // Broadcast real-time stock update
        realtimeEventService.publishInventoryEvent(
                "STOCK_ADJUSTED",
                batch.getMedicineId(),
                batch.getBatchId(),
                "Stock adjusted: " + (qtyChanged > 0 ? "+" : "") + qtyChanged + " units for " + medName
        );

        return ResponseEntity.ok(ApiResponse.ok("Stock adjusted successfully", savedBatch));
    }

    @GetMapping("/adjustments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<List<StockAdjustment>>> getAdjustments() {
        List<StockAdjustment> list = stockAdjustmentRepository.findAllByOrderByAdjustmentDateDesc();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    @Transactional
    public ResponseEntity<ApiResponse<InventoryBatch>> receiveStock(
            @RequestBody ReceiveStockRequest req,
            HttpServletRequest request) {

        if (req.getMedicineId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Medicine ID is required"));
        }
        if (req.getBatchNumber() == null || req.getBatchNumber().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Batch number is required"));
        }
        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Quantity must be greater than zero"));
        }
        if (req.getExpiryDate() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Expiry date is required"));
        }

        Medicine medicine = medicineRepository.findById(req.getMedicineId()).orElse(null);
        if (medicine == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Medicine not found with ID: " + req.getMedicineId()));
        }

        String batchNumber = req.getBatchNumber().trim();
        Optional<InventoryBatch> existingOpt = inventoryBatchRepository.findByBatchNumber(batchNumber);

        InventoryBatch batch;
        int qtyBefore = 0;

        if (existingOpt.isPresent()) {
            batch = existingOpt.get();
            qtyBefore = batch.getQuantityAvailable();
            batch.setQuantityReceived(batch.getQuantityReceived() + req.getQuantity());
            batch.setQuantityAvailable(qtyBefore + req.getQuantity());
            if (req.getPurchaseCost() != null) batch.setPurchaseCost(req.getPurchaseCost());
            if (req.getSellingPrice() != null) batch.setSellingPrice(req.getSellingPrice());
        } else {
            batch = new InventoryBatch();
            batch.setMedicineId(req.getMedicineId());
            batch.setSupplierId(req.getSupplierId());
            batch.setBatchNumber(batchNumber);
            batch.setManufacturingDate(req.getManufacturingDate());
            batch.setExpiryDate(req.getExpiryDate());
            batch.setQuantityReceived(req.getQuantity());
            batch.setQuantityAvailable(req.getQuantity());
            batch.setPurchaseCost(req.getPurchaseCost() != null ? req.getPurchaseCost() : BigDecimal.ZERO);
            batch.setSellingPrice(req.getSellingPrice() != null ? req.getSellingPrice() : BigDecimal.ZERO);
        }

        InventoryBatch savedBatch = inventoryBatchRepository.save(batch);

        Integer userId = currentUserService.getCurrentUserId();
        StockLog stockLog = new StockLog();
        stockLog.setBatchId(savedBatch.getBatchId());
        stockLog.setUserId(userId != null ? userId : 1);
        stockLog.setTransactionType("RECEIVED");
        stockLog.setQuantityChanged(req.getQuantity());
        stockLog.setQuantityBefore(qtyBefore);
        stockLog.setQuantityAfter(savedBatch.getQuantityAvailable());
        stockLog.setReferenceType("RECEIVING_RECORD");
        stockLog.setNotes(req.getNotes() != null ? req.getNotes() : "Stock received into batch " + batchNumber);
        stockLogRepository.save(stockLog);

        auditService.logAction(
                userId,
                "STOCK_RECEIVED",
                "BATCH",
                savedBatch.getBatchId(),
                "Received " + req.getQuantity() + " units of " + medicine.getMedicineName() + " (Batch " + batchNumber + ")",
                request
        );

        realtimeEventService.publishInventoryEvent(
                "STOCK_UPDATED",
                savedBatch.getMedicineId(),
                savedBatch.getBatchId(),
                "Received " + req.getQuantity() + " units of " + medicine.getMedicineName()
        );

        return ResponseEntity.ok(ApiResponse.ok("Stock received successfully", savedBatch));
    }

    @PostMapping("/dispense")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @Transactional
    public ResponseEntity<ApiResponse<InventoryBatch>> dispenseStock(
            @RequestBody DispenseStockRequest req,
            HttpServletRequest request) {

        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Dispense quantity must be greater than zero"));
        }

        InventoryBatch batch = null;
        if (req.getBatchId() != null) {
            batch = inventoryBatchRepository.findById(req.getBatchId()).orElse(null);
        } else if (req.getBatchNumber() != null && !req.getBatchNumber().isBlank()) {
            batch = inventoryBatchRepository.findByBatchNumber(req.getBatchNumber().trim()).orElse(null);
        }

        if (batch == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Batch not found"));
        }

        int available = batch.getQuantityAvailable();
        if (available < req.getQuantity()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Insufficient stock in batch " + batch.getBatchNumber() + ". Available: " + available + ", Requested: " + req.getQuantity()));
        }

        int qtyBefore = available;
        int qtyAfter = available - req.getQuantity();
        batch.setQuantityAvailable(qtyAfter);
        InventoryBatch savedBatch = inventoryBatchRepository.save(batch);

        Integer userId = currentUserService.getCurrentUserId();
        StockLog stockLog = new StockLog();
        stockLog.setBatchId(savedBatch.getBatchId());
        stockLog.setUserId(userId != null ? userId : 1);
        stockLog.setTransactionType("DISPENSED");
        stockLog.setQuantityChanged(-req.getQuantity());
        stockLog.setQuantityBefore(qtyBefore);
        stockLog.setQuantityAfter(qtyAfter);
        stockLog.setReferenceType(req.getReferenceType() != null ? req.getReferenceType() : "PRESCRIPTION");
        stockLog.setReferenceId(req.getReferenceId());
        stockLog.setNotes(req.getNotes() != null ? req.getNotes() : "Dispensed from batch " + batch.getBatchNumber());
        stockLogRepository.save(stockLog);

        String medName = batch.getMedicine() != null ? batch.getMedicine().getMedicineName() : "Medicine";
        auditService.logAction(
                userId,
                "STOCK_DISPENSED",
                "BATCH",
                savedBatch.getBatchId(),
                "Dispensed " + req.getQuantity() + " units of " + medName + " (Batch " + batch.getBatchNumber() + ")",
                request
        );

        realtimeEventService.publishInventoryEvent(
                "STOCK_UPDATED",
                savedBatch.getMedicineId(),
                savedBatch.getBatchId(),
                "Dispensed " + req.getQuantity() + " units of " + medName
        );

        return ResponseEntity.ok(ApiResponse.ok("Stock dispensed successfully", savedBatch));
    }

    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    @Transactional
    public ResponseEntity<ApiResponse<Task>> submitStockRequest(
            @RequestBody StockRequisitionRequest req,
            HttpServletRequest request) {

        if (req.getQuantity() == null || req.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Requested quantity must be positive"));
        }

        Integer userId = currentUserService.getCurrentUserId();
        String medName = req.getMedicineName() != null ? req.getMedicineName() : "Requested Medicine";
        String ward = req.getWard() != null ? req.getWard() : "General Ward";

        Task task = new Task();
        task.setTitle("Requisition: " + req.getQuantity() + "x " + medName + " for " + ward);
        task.setDescription("Staff stock request submitted. Notes: " + (req.getNotes() != null ? req.getNotes() : "Standard refill"));
        task.setAssignedBy(userId != null ? userId : 3);
        task.setAssignedTo(2); // Pharmacist
        task.setPriority(req.getPriority() != null ? req.getPriority().toUpperCase() : "MEDIUM");
        task.setStatus("PENDING");
        task.setDueDate(LocalDateTime.now().plusDays(1));

        Task savedTask = taskRepository.save(task);

        notificationService.notifyRole(
                2,
                "New Stock Request: " + medName,
                "Ward " + ward + " requested " + req.getQuantity() + " units of " + medName + ".",
                "STOCK_REQUEST",
                "TASK",
                savedTask.getTaskId()
        );

        auditService.logAction(
                userId,
                "STOCK_REQUEST",
                "TASK",
                savedTask.getTaskId(),
                "Submitted stock request for " + req.getQuantity() + " units of " + medName + " (" + ward + ")",
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Stock requisition submitted successfully", savedTask));
    }

    /* ================================================================
     *  POST /api/inventory/discrepancies — Staff reports physical count difference
     *  Workflow 5: Record physical stock count discrepancy without silent overwrite
     * ================================================================ */
    @PostMapping("/discrepancies")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    @Transactional
    public ResponseEntity<ApiResponse<StockDiscrepancy>> reportDiscrepancy(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        if (!body.containsKey("medicineId")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Medicine ID is required"));
        }
        Integer medicineId = ((Number) body.get("medicineId")).intValue();

        if (!body.containsKey("countedQuantity")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Physical counted quantity is required"));
        }
        int countedQty = ((Number) body.get("countedQuantity")).intValue();

        int expectedQty = body.containsKey("expectedQuantity")
                ? ((Number) body.get("expectedQuantity")).intValue()
                : 0;

        String reason = body.containsKey("reason") ? body.get("reason").toString().trim() : "";
        if (reason.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("A documented reason is strictly required when reporting a discrepancy."));
        }

        Integer batchId = body.containsKey("batchId") && body.get("batchId") != null
                ? ((Number) body.get("batchId")).intValue()
                : null;

        int difference = countedQty - expectedQty;

        Integer userId = currentUserService.getCurrentUserId();

        StockDiscrepancy discrepancy = new StockDiscrepancy();
        discrepancy.setMedicineId(medicineId);
        discrepancy.setBatchId(batchId);
        discrepancy.setExpectedQuantity(expectedQty);
        discrepancy.setCountedQuantity(countedQty);
        discrepancy.setDiscrepancy(difference);
        discrepancy.setReason(reason);
        discrepancy.setReportedBy(userId != null ? userId : 3);
        discrepancy.setStatus("PENDING");

        StockDiscrepancy saved = stockDiscrepancyRepository.save(discrepancy);

        Medicine med = medicineRepository.findById(medicineId).orElse(null);
        String medName = med != null ? med.getMedicineName() : "Medicine #" + medicineId;

        // Create Task for Pharmacist review
        Task task = new Task();
        task.setTitle("Review Stock Discrepancy: " + medName + " (" + (difference > 0 ? "+" : "") + difference + ")");
        task.setDescription("Staff reported physical count: " + countedQty + " vs expected: " + expectedQty + ". Reason: " + reason);
        task.setAssignedBy(userId != null ? userId : 3);
        task.setAssignedTo(2); // Pharmacist Alex Rivera
        task.setPriority("HIGH");
        task.setStatus("PENDING");
        task.setDueDate(LocalDateTime.now().plusDays(2));
        taskRepository.save(task);

        // Notify Pharmacist and Admin
        String notifMsg = "Physical count discrepancy of " + difference + " units reported for " + medName + ". Reason: " + reason;
        notificationService.notifyAdmins("Stock Discrepancy Reported", notifMsg, "DISCREPANCY", "DISCREPANCY", saved.getDiscrepancyId());
        notificationService.notifyRole(2, "Stock Discrepancy Reported", notifMsg, "DISCREPANCY", "DISCREPANCY", saved.getDiscrepancyId());

        auditService.logAction(
                userId,
                "REPORT_STOCK_DISCREPANCY",
                "DISCREPANCY",
                saved.getDiscrepancyId(),
                "Reported physical count discrepancy for " + medName + " (Counted: " + countedQty + ", Expected: " + expectedQty + "). Reason: " + reason,
                request
        );

        // Broadcast real-time event
        realtimeEventService.publishDiscrepancyEvent(
                "DISCREPANCY_REPORTED",
                saved,
                "Physical count discrepancy reported for " + medName
        );

        return ResponseEntity.ok(ApiResponse.ok("Stock count discrepancy recorded for clinical review", saved));
    }

    @GetMapping("/discrepancies")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    public ResponseEntity<ApiResponse<List<StockDiscrepancy>>> getDiscrepancies(
            @RequestParam(required = false) String status) {

        List<StockDiscrepancy> list;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = stockDiscrepancyRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        } else {
            list = stockDiscrepancyRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /* ================================================================
     *  PATCH /api/inventory/discrepancies/{id}/resolve — Admin/Pharmacist resolves discrepancy
     *  Only authorized Pharmacist/Admin can approve adjustment and update inventory
     * ================================================================ */
    @PatchMapping("/discrepancies/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @Transactional
    public ResponseEntity<ApiResponse<StockDiscrepancy>> resolveDiscrepancy(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        Optional<StockDiscrepancy> discOpt = stockDiscrepancyRepository.findById(id);
        if (discOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StockDiscrepancy disc = discOpt.get();
        if (!"PENDING".equals(disc.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Discrepancy has already been resolved or processed."));
        }

        String action = body.getOrDefault("action", "APPROVE").trim().toUpperCase();
        String notes = body.getOrDefault("notes", "Discrepancy investigated and processed.");

        Integer userId = currentUserService.getCurrentUserId();
        disc.setResolvedBy(userId != null ? userId : 1);
        disc.setResolvedAt(LocalDateTime.now());
        disc.setResolutionNotes(notes);

        Medicine med = medicineRepository.findById(disc.getMedicineId()).orElse(null);
        String medName = med != null ? med.getMedicineName() : "Medicine #" + disc.getMedicineId();

        if ("APPROVE".equals(action) || "APPROVE_ADJUSTMENT".equals(action)) {
            disc.setStatus("RESOLVED");

            // Apply stock adjustment to batch if present, or to the primary batch of this medicine
            InventoryBatch targetBatch = null;
            if (disc.getBatchId() != null) {
                targetBatch = inventoryBatchRepository.findById(disc.getBatchId()).orElse(null);
            }
            if (targetBatch == null) {
                List<InventoryBatch> batches = inventoryBatchRepository.findByMedicineId(disc.getMedicineId());
                if (!batches.isEmpty()) targetBatch = batches.get(0);
            }

            if (targetBatch != null) {
                int qtyBefore = targetBatch.getQuantityAvailable();
                int qtyAfter = Math.max(0, qtyBefore + disc.getDiscrepancy());
                targetBatch.setQuantityAvailable(qtyAfter);
                inventoryBatchRepository.save(targetBatch);

                // Create StockAdjustment record
                StockAdjustment adj = new StockAdjustment();
                adj.setBatchId(targetBatch.getBatchId());
                adj.setUserId(userId != null ? userId : 1);
                adj.setAdjustmentType("DISCREPANCY_ADJUSTMENT");
                adj.setQuantityChanged(disc.getDiscrepancy());
                adj.setReason("Discrepancy resolution: " + disc.getReason() + " | Notes: " + notes);
                StockAdjustment savedAdj = stockAdjustmentRepository.save(adj);
                disc.setAdjustmentId(savedAdj.getAdjustmentId());

                // Create StockLog record
                StockLog log = new StockLog();
                log.setBatchId(targetBatch.getBatchId());
                log.setUserId(userId != null ? userId : 1);
                log.setTransactionType("DISCREPANCY_ADJUSTMENT");
                log.setQuantityChanged(disc.getDiscrepancy());
                log.setQuantityBefore(qtyBefore);
                log.setQuantityAfter(qtyAfter);
                log.setReferenceType("DISCREPANCY");
                log.setReferenceId(disc.getDiscrepancyId());
                log.setNotes("Resolved by " + (currentUserService.hasRole("ADMIN") ? "Admin" : "Pharmacist"));
                stockLogRepository.save(log);

                realtimeEventService.publishInventoryEvent(
                        "STOCK_UPDATED",
                        targetBatch.getMedicineId(),
                        targetBatch.getBatchId(),
                        "Stock adjusted by " + disc.getDiscrepancy() + " following discrepancy resolution"
                );
            }
        } else {
            disc.setStatus("REJECTED");
        }

        StockDiscrepancy saved = stockDiscrepancyRepository.save(disc);

        auditService.logAction(
                userId,
                "RESOLVE_STOCK_DISCREPANCY",
                "DISCREPANCY",
                saved.getDiscrepancyId(),
                "Resolved discrepancy for " + medName + " (Status: " + saved.getStatus() + "). Notes: " + notes,
                request
        );

        // Notify reporting staff member
        if (saved.getReportedBy() != null) {
            notificationService.sendNotification(
                    saved.getReportedBy(),
                    "Discrepancy Investigation Complete",
                    "Your reported discrepancy for " + medName + " was marked " + saved.getStatus() + ". Notes: " + notes,
                    "DISCREPANCY",
                    "DISCREPANCY",
                    saved.getDiscrepancyId()
            );
        }

        realtimeEventService.publishDiscrepancyEvent(
                "DISCREPANCY_RESOLVED",
                saved,
                "Discrepancy for " + medName + " marked " + saved.getStatus()
        );

        return ResponseEntity.ok(ApiResponse.ok("Discrepancy resolution recorded", saved));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<StockLog>>> getTransactions(
            @RequestParam(required = false) String type) {

        List<StockLog> logs;
        if (type != null && !type.isBlank()) {
            logs = stockLogRepository.findByTransactionTypeOrderByCreatedAtDesc(type.trim().toUpperCase());
        } else {
            logs = stockLogRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
