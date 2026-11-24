package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.*;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
public class ReportController {

    private final ReportRecordRepository reportRecordRepository;
    private final MedicineRepository medicineRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockLogRepository stockLogRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public ReportController(ReportRecordRepository reportRecordRepository,
                            MedicineRepository medicineRepository,
                            CategoryRepository categoryRepository,
                            InventoryBatchRepository inventoryBatchRepository,
                            SupplierRepository supplierRepository,
                            PurchaseOrderRepository purchaseOrderRepository,
                            StockLogRepository stockLogRepository,
                            StockAdjustmentRepository stockAdjustmentRepository,
                            AuditLogRepository auditLogRepository,
                            UserRepository userRepository,
                            CurrentUserService currentUserService,
                            AuditService auditService) {
        this.reportRecordRepository = reportRecordRepository;
        this.medicineRepository = medicineRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockLogRepository = stockLogRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ReportRecord>>> getReportHistory() {
        List<ReportRecord> history = reportRecordRepository.findAllByOrderByGeneratedAtDesc();
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @PostMapping("/generate")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateReport(
            @RequestBody Map<String, Object> params,
            HttpServletRequest request) {

        String reportType = (String) params.getOrDefault("reportType", "INVENTORY_SUMMARY");
        String dateFromStr = (String) params.get("dateFrom");
        String dateToStr = (String) params.get("dateTo");
        Integer categoryId = params.containsKey("categoryId") && params.get("categoryId") != null
                ? ((Number) params.get("categoryId")).intValue() : null;
        Integer supplierId = params.containsKey("supplierId") && params.get("supplierId") != null
                ? ((Number) params.get("supplierId")).intValue() : null;

        LocalDate dateFrom = (dateFromStr != null && !dateFromStr.isBlank()) ? LocalDate.parse(dateFromStr) : null;
        LocalDate dateTo = (dateToStr != null && !dateToStr.isBlank()) ? LocalDate.parse(dateToStr) : null;

        Integer userId = currentUserService.getCurrentUserId();
        String generatedBy = "System Administrator";
        if (userId != null) {
            Optional<User> uOpt = userRepository.findById(userId);
            if (uOpt.isPresent()) generatedBy = uOpt.get().getFullName();
        }

        List<String> headers = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> summary = new HashMap<>();

        LocalDate today = LocalDate.now();
        List<InventoryBatch> allBatches = inventoryBatchRepository.findAll();
        List<Medicine> allMedicines = medicineRepository.findAll();
        List<Category> allCategories = categoryRepository.findAll();

        switch (reportType.toUpperCase()) {
            case "INVENTORY_SUMMARY": {
                headers = List.of("Category", "Total Medicines", "Total Available Units", "Estimated Valuation ($)");
                BigDecimal totalValuation = BigDecimal.ZERO;
                long totalUnits = 0;

                for (Category cat : allCategories) {
                    if (categoryId != null && !cat.getCategoryId().equals(categoryId)) continue;

                    long medCount = allMedicines.stream().filter(m -> cat.getCategoryId().equals(m.getCategoryId())).count();
                    long units = allBatches.stream()
                            .filter(b -> b.getMedicine() != null && cat.getCategoryId().equals(b.getMedicine().getCategoryId()))
                            .mapToLong(InventoryBatch::getQuantityAvailable).sum();
                    BigDecimal val = allBatches.stream()
                            .filter(b -> b.getMedicine() != null && cat.getCategoryId().equals(b.getMedicine().getCategoryId()))
                            .map(b -> b.getPurchaseCost().multiply(BigDecimal.valueOf(b.getQuantityAvailable())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    totalUnits += units;
                    totalValuation = totalValuation.add(val);

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Category", cat.getCategoryName());
                    row.put("Total Medicines", medCount);
                    row.put("Total Available Units", units);
                    row.put("Estimated Valuation ($)", String.format("$%.2f", val));
                    rows.add(row);
                }
                summary.put("Total Units", totalUnits);
                summary.put("Total Valuation", String.format("$%.2f", totalValuation));
                break;
            }

            case "MEDICINE_LIST": {
                headers = List.of("ID", "Medicine Name", "Generic Name", "Brand", "Form", "Strength", "Category", "Stock On Hand");
                for (Medicine m : allMedicines) {
                    if (categoryId != null && !categoryId.equals(m.getCategoryId())) continue;
                    long stock = allBatches.stream().filter(b -> m.getMedicineId().equals(b.getMedicineId())).mapToLong(InventoryBatch::getQuantityAvailable).sum();

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("ID", m.getMedicineId());
                    row.put("Medicine Name", m.getMedicineName());
                    row.put("Generic Name", m.getGenericName() != null ? m.getGenericName() : "—");
                    row.put("Brand", m.getBrandName() != null ? m.getBrandName() : "—");
                    row.put("Form", m.getDosageForm() != null ? m.getDosageForm() : "—");
                    row.put("Strength", m.getStrength() != null ? m.getStrength() : "—");
                    row.put("Category", m.getCategory() != null ? m.getCategory().getCategoryName() : "General");
                    row.put("Stock On Hand", stock);
                    rows.add(row);
                }
                summary.put("Total Medicines Listed", rows.size());
                break;
            }

            case "CATEGORY_STOCK": {
                headers = List.of("Category ID", "Category Name", "Description", "Medicines Count", "Available Units");
                for (Category cat : allCategories) {
                    long medCount = allMedicines.stream().filter(m -> cat.getCategoryId().equals(m.getCategoryId())).count();
                    long units = allBatches.stream()
                            .filter(b -> b.getMedicine() != null && cat.getCategoryId().equals(b.getMedicine().getCategoryId()))
                            .mapToLong(InventoryBatch::getQuantityAvailable).sum();

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Category ID", cat.getCategoryId());
                    row.put("Category Name", cat.getCategoryName());
                    row.put("Description", cat.getDescription() != null ? cat.getDescription() : "—");
                    row.put("Medicines Count", medCount);
                    row.put("Available Units", units);
                    rows.add(row);
                }
                break;
            }

            case "LOW_STOCK": {
                headers = List.of("Batch No", "Medicine", "Category", "Supplier", "Quantity Available", "Reorder Threshold", "Status");
                for (InventoryBatch b : allBatches) {
                    if (b.getQuantityAvailable() <= 50) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("Batch No", b.getBatchNumber());
                        row.put("Medicine", b.getMedicine() != null ? b.getMedicine().getMedicineName() : "Unknown");
                        row.put("Category", (b.getMedicine() != null && b.getMedicine().getCategory() != null) ? b.getMedicine().getCategory().getCategoryName() : "General");
                        row.put("Supplier", b.getSupplier() != null ? b.getSupplier().getSupplierName() : "Direct");
                        row.put("Quantity Available", b.getQuantityAvailable());
                        row.put("Reorder Threshold", 50);
                        row.put("Status", b.getQuantityAvailable() == 0 ? "OUT_OF_STOCK" : "LOW_STOCK");
                        rows.add(row);
                    }
                }
                summary.put("Low-Stock Batches Count", rows.size());
                break;
            }

            case "EXPIRED_MEDICINE": {
                headers = List.of("Batch No", "Medicine", "Category", "Supplier", "Available Qty", "Expiry Date", "Days Overdue");
                for (InventoryBatch b : allBatches) {
                    if (b.getExpiryDate() != null && b.getExpiryDate().isBefore(today) && b.getQuantityAvailable() > 0) {
                        long daysOverdue = ChronoUnit.DAYS.between(b.getExpiryDate(), today);
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("Batch No", b.getBatchNumber());
                        row.put("Medicine", b.getMedicine() != null ? b.getMedicine().getMedicineName() : "Unknown");
                        row.put("Category", (b.getMedicine() != null && b.getMedicine().getCategory() != null) ? b.getMedicine().getCategory().getCategoryName() : "General");
                        row.put("Supplier", b.getSupplier() != null ? b.getSupplier().getSupplierName() : "Direct");
                        row.put("Available Qty", b.getQuantityAvailable());
                        row.put("Expiry Date", b.getExpiryDate().toString());
                        row.put("Days Overdue", daysOverdue + " days");
                        rows.add(row);
                    }
                }
                summary.put("Total Expired Batches", rows.size());
                break;
            }

            case "UPCOMING_EXPIRY": {
                headers = List.of("Batch No", "Medicine", "Category", "Available Qty", "Expiry Date", "Days Remaining", "Risk Level");
                for (InventoryBatch b : allBatches) {
                    if (b.getExpiryDate() != null && !b.getExpiryDate().isBefore(today) && !b.getExpiryDate().isAfter(today.plusDays(90)) && b.getQuantityAvailable() > 0) {
                        long daysRem = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                        String risk = daysRem <= 7 ? "CRITICAL" : (daysRem <= 30 ? "EXPIRING_SOON" : "WATCHLIST");
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("Batch No", b.getBatchNumber());
                        row.put("Medicine", b.getMedicine() != null ? b.getMedicine().getMedicineName() : "Unknown");
                        row.put("Category", (b.getMedicine() != null && b.getMedicine().getCategory() != null) ? b.getMedicine().getCategory().getCategoryName() : "General");
                        row.put("Available Qty", b.getQuantityAvailable());
                        row.put("Expiry Date", b.getExpiryDate().toString());
                        row.put("Days Remaining", daysRem + " days");
                        row.put("Risk Level", risk);
                        rows.add(row);
                    }
                }
                summary.put("Total Approaching Expiry", rows.size());
                break;
            }

            case "BATCH_INVENTORY": {
                headers = List.of("Batch No", "Medicine", "Supplier", "Qty Received", "Qty Available", "Purchase Cost", "Mfg Date", "Expiry Date");
                for (InventoryBatch b : allBatches) {
                    if (supplierId != null && !supplierId.equals(b.getSupplierId())) continue;
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Batch No", b.getBatchNumber());
                    row.put("Medicine", b.getMedicine() != null ? b.getMedicine().getMedicineName() : "Unknown");
                    row.put("Supplier", b.getSupplier() != null ? b.getSupplier().getSupplierName() : "Direct");
                    row.put("Qty Received", b.getQuantityReceived());
                    row.put("Qty Available", b.getQuantityAvailable());
                    row.put("Purchase Cost", String.format("$%.2f", b.getPurchaseCost()));
                    row.put("Mfg Date", b.getManufacturingDate() != null ? b.getManufacturingDate().toString() : "—");
                    row.put("Expiry Date", b.getExpiryDate().toString());
                    rows.add(row);
                }
                break;
            }

            case "SUPPLIER_REPORT": {
                headers = List.of("Supplier ID", "Supplier Name", "Contact Person", "Phone", "Email", "Status", "Total POs");
                List<Supplier> suppliers = supplierRepository.findAll();
                for (Supplier s : suppliers) {
                    long poCount = purchaseOrderRepository.countBySupplierId(s.getSupplierId());
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Supplier ID", s.getSupplierId());
                    row.put("Supplier Name", s.getSupplierName());
                    row.put("Contact Person", s.getContactPerson() != null ? s.getContactPerson() : "—");
                    row.put("Phone", s.getPhone() != null ? s.getPhone() : "—");
                    row.put("Email", s.getEmail() != null ? s.getEmail() : "—");
                    row.put("Status", s.getActive() ? "ACTIVE" : "INACTIVE");
                    row.put("Total POs", poCount);
                    rows.add(row);
                }
                break;
            }

            case "PURCHASE_ORDER": {
                headers = List.of("PO ID", "Supplier", "Order Date", "Expected Delivery", "Status", "Total Amount ($)");
                List<PurchaseOrder> pos = purchaseOrderRepository.findAll();
                BigDecimal totalAmount = BigDecimal.ZERO;
                for (PurchaseOrder po : pos) {
                    if (supplierId != null && !supplierId.equals(po.getSupplierId())) continue;
                    if (dateFrom != null && po.getOrderDate().isBefore(dateFrom)) continue;
                    if (dateTo != null && po.getOrderDate().isAfter(dateTo)) continue;

                    totalAmount = totalAmount.add(po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("PO ID", "#" + po.getPurchaseOrderId());
                    row.put("Supplier", po.getSupplier() != null ? po.getSupplier().getSupplierName() : "Supplier #" + po.getSupplierId());
                    row.put("Order Date", po.getOrderDate().toString());
                    row.put("Expected Delivery", po.getExpectedDeliveryDate() != null ? po.getExpectedDeliveryDate().toString() : "—");
                    row.put("Status", po.getStatus());
                    row.put("Total Amount ($)", String.format("$%.2f", po.getTotalAmount()));
                    rows.add(row);
                }
                summary.put("Total Orders", rows.size());
                summary.put("Total Spend", String.format("$%.2f", totalAmount));
                break;
            }

            case "PURCHASE_SPENDING": {
                headers = List.of("Month", "Total Orders", "Total Spending ($)");
                List<PurchaseOrder> pos = purchaseOrderRepository.findAll();
                DateTimeFormatter mFmt = DateTimeFormatter.ofPattern("yyyy-MM");
                Map<String, BigDecimal> monthlySpend = new TreeMap<>();
                Map<String, Long> monthlyCount = new TreeMap<>();

                for (PurchaseOrder po : pos) {
                    if (po.getOrderDate() != null) {
                        String key = po.getOrderDate().format(mFmt);
                        monthlySpend.put(key, monthlySpend.getOrDefault(key, BigDecimal.ZERO).add(po.getTotalAmount()));
                        monthlyCount.put(key, monthlyCount.getOrDefault(key, 0L) + 1);
                    }
                }
                for (Map.Entry<String, BigDecimal> entry : monthlySpend.entrySet()) {
                    String monthKey = entry.getKey();
                    BigDecimal amt = entry.getValue();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Month", monthKey);
                    row.put("Total Orders", monthlyCount.getOrDefault(monthKey, 0L));
                    row.put("Total Spending ($)", String.format("$%.2f", amt));
                    rows.add(row);
                }
                break;
            }

            case "STOCK_MOVEMENT": {
                headers = List.of("Log ID", "Batch", "Transaction Type", "Qty Changed", "Qty Before", "Qty After", "Date & Time");
                List<StockLog> logs = stockLogRepository.findAllByOrderByCreatedAtDesc();
                for (StockLog log : logs) {
                    if (dateFrom != null && log.getCreatedAt().toLocalDate().isBefore(dateFrom)) continue;
                    if (dateTo != null && log.getCreatedAt().toLocalDate().isAfter(dateTo)) continue;

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Log ID", log.getStockLogId());
                    row.put("Batch", log.getBatch() != null ? log.getBatch().getBatchNumber() : "Batch #" + log.getBatchId());
                    row.put("Transaction Type", log.getTransactionType());
                    row.put("Qty Changed", log.getQuantityChanged());
                    row.put("Qty Before", log.getQuantityBefore());
                    row.put("Qty After", log.getQuantityAfter());
                    row.put("Date & Time", log.getCreatedAt().toString());
                    rows.add(row);
                }
                break;
            }

            case "STOCK_ADJUSTMENT": {
                headers = List.of("Adjustment ID", "Batch", "User", "Type", "Qty Changed", "Reason", "Date");
                List<StockAdjustment> adjs = stockAdjustmentRepository.findAllByOrderByAdjustmentDateDesc();
                for (StockAdjustment adj : adjs) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Adjustment ID", adj.getAdjustmentId());
                    row.put("Batch", adj.getBatch() != null ? adj.getBatch().getBatchNumber() : "Batch #" + adj.getBatchId());
                    row.put("User", adj.getUser() != null ? adj.getUser().getFullName() : "User #" + adj.getUserId());
                    row.put("Type", adj.getAdjustmentType());
                    row.put("Qty Changed", adj.getQuantityChanged());
                    row.put("Reason", adj.getReason());
                    row.put("Date", adj.getAdjustmentDate() != null ? adj.getAdjustmentDate().toString() : "—");
                    rows.add(row);
                }
                break;
            }

            case "USER_AUDIT": {
                headers = List.of("Log ID", "User ID", "Action", "Target Entity", "Details", "IP Address", "Timestamp");
                List<AuditLog> auditLogs = auditLogRepository.findTop25ByOrderByCreatedAtDesc();
                for (AuditLog a : auditLogs) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("Log ID", a.getAuditLogId());
                    row.put("User ID", a.getUserId() != null ? a.getUserId() : "System");
                    row.put("Action", a.getActionType());
                    row.put("Target Entity", (a.getEntityType() != null ? a.getEntityType() : "Entity") + " #" + a.getEntityId());
                    row.put("Details", a.getActionDescription());
                    row.put("IP Address", a.getIpAddress() != null ? a.getIpAddress() : "—");
                    row.put("Timestamp", a.getCreatedAt() != null ? a.getCreatedAt().toString() : "—");
                    rows.add(row);
                }
                break;
            }

            default:
                headers = List.of("Notice");
                rows = List.of(Map.of("Notice", "Select a valid report type."));
                break;
        }

        // Persist report generation history into database table `reports`
        String reportName = reportType.replace("_", " ") + " Report";
        ReportRecord record = new ReportRecord();
        record.setGeneratedBy(userId != null ? userId : 1);
        record.setReportName(reportName);
        record.setReportType(reportType);
        record.setDateFrom(dateFrom);
        record.setDateTo(dateTo);
        reportRecordRepository.save(record);

        auditService.logAction(
                userId,
                "GENERATE_REPORT",
                "REPORT",
                record.getReportId(),
                "Generated " + reportName + " (Total records: " + rows.size() + ")",
                request
        );

        Map<String, Object> result = new HashMap<>();
        result.put("reportId", record.getReportId());
        result.put("reportName", reportName);
        result.put("reportType", reportType);
        result.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        result.put("generatedBy", generatedBy);
        result.put("dateFrom", dateFrom);
        result.put("dateTo", dateTo);
        result.put("headers", headers);
        result.put("rows", rows);
        result.put("totalRecords", rows.size());
        result.put("summary", summary);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
