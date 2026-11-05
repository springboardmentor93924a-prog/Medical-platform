package com.medistock.medistock.service;

import com.medistock.medistock.dto.DashboardStatsDto;
import com.medistock.medistock.dto.BulkMedicinePriceRequestDto;
import com.medistock.medistock.dto.InventoryReportDto;
import com.medistock.medistock.dto.InventoryMovementDto;
import com.medistock.medistock.dto.MedicineCatalogDto;
import com.medistock.medistock.dto.MedicineRequestDto;
import com.medistock.medistock.dto.NotificationDto;
import com.medistock.medistock.dto.PurchaseOrderDto;
import com.medistock.medistock.dto.PurchaseOrderItemRequestDto;
import com.medistock.medistock.dto.PurchaseOrderRequestDto;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminDashboardService {

    @PersistenceContext
    private EntityManager entityManager;

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationRepository notificationRepository;
    private final StockLogRepository stockLogRepository;
    private final UserRepository userRepository;

    public AdminDashboardService(
            MedicineRepository medicineRepository,
            MedicineBatchRepository medicineBatchRepository,
            SupplierRepository supplierRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            CategoryRepository categoryRepository,
            NotificationRepository notificationRepository,
            StockLogRepository stockLogRepository,
            UserRepository userRepository) {
        this.medicineRepository = medicineRepository;
        this.medicineBatchRepository = medicineBatchRepository;
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.categoryRepository = categoryRepository;
        this.notificationRepository = notificationRepository;
        this.stockLogRepository = stockLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto dto = new DashboardStatsDto();

        // 1. Basic Operational Counts directly from medistock.sql tables
        long totalMedicines = medicineRepository.count();
        dto.setTotalMedicines(totalMedicines);

        BigDecimal inventoryValue = medicineBatchRepository.calculateTotalInventoryValue();
        dto.setInventoryValue(inventoryValue != null ? inventoryValue : BigDecimal.ZERO);

        long poCount = purchaseOrderRepository.count();
        dto.setPurchaseOrdersCount(poCount);

        long supplierCount = supplierRepository.count();
        dto.setSuppliersCount(supplierCount);

        // 2. Stock Health Breakdown
        long inStock = medicineBatchRepository.countInStockMedicines();
        long lowStock = medicineBatchRepository.countLowStockMedicines();
        long outOfStock = medicineBatchRepository.countOutOfStockMedicines();

        dto.setLowStockCount(lowStock);

        DashboardStatsDto.StockStatusDto stockStatus = new DashboardStatsDto.StockStatusDto();
        stockStatus.setInStock(inStock);
        stockStatus.setLowStock(lowStock);
        stockStatus.setOutOfStock(outOfStock);

        long totalClassified = inStock + lowStock + outOfStock;
        if (totalClassified > 0) {
            stockStatus.setInStockPercent(BigDecimal.valueOf((double) inStock / totalClassified * 100)
                    .setScale(0, RoundingMode.HALF_UP).doubleValue());
            stockStatus.setLowStockPercent(BigDecimal.valueOf((double) lowStock / totalClassified * 100)
                    .setScale(0, RoundingMode.HALF_UP).doubleValue());
            stockStatus.setOutOfStockPercent(BigDecimal.valueOf((double) outOfStock / totalClassified * 100)
                    .setScale(0, RoundingMode.HALF_UP).doubleValue());
        } else {
            stockStatus.setInStockPercent(0.0);
            stockStatus.setLowStockPercent(0.0);
            stockStatus.setOutOfStockPercent(0.0);
        }

        if (totalMedicines == 0) {
            stockStatus.setMessage("No pharmaceuticals currently logged. Add stock items to begin tracking.");
        } else if (lowStock == 0 && outOfStock == 0) {
            stockStatus.setMessage("All registered medicines are in stock and meet safety buffers.");
        } else if (lowStock > 0) {
            stockStatus.setMessage(lowStock + " medicine(s) have reached reorder thresholds.");
        } else {
            stockStatus.setMessage(outOfStock + " medicine(s) are depleted and need restocking.");
        }
        dto.setStockStatus(stockStatus);

        // 3. Expiry Monitoring directly from database
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysLater = today.plusDays(30);

        long expiredCount = medicineBatchRepository.countExpiredBatches(today);
        long nearExpiryCount = medicineBatchRepository.countNearExpiryBatches(today, thirtyDaysLater);

        DashboardStatsDto.ExpiringSoonDto expiringSoon = new DashboardStatsDto.ExpiringSoonDto();
        expiringSoon.setNearExpiryCount(nearExpiryCount);
        expiringSoon.setExpiredCount(expiredCount);
        dto.setExpiringSoon(expiringSoon);

        // 4. Procurement Orders directly from database
        List<PurchaseOrder> recentPOs = purchaseOrderRepository.findRecentPurchaseOrders(PageRequest.of(0, 5));
        List<DashboardStatsDto.RecentOrderDto> poDtos = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");

        for (PurchaseOrder po : recentPOs) {
            String poNumber = "PO-" + String.format("%04d", po.getPurchaseOrderId());
            String supplierName = (po.getSupplier() != null) ? po.getSupplier().getSupplierName() : "General Supplier";
            String formattedDate = (po.getOrderDate() != null) ? po.getOrderDate().format(formatter) : "";
            poDtos.add(new DashboardStatsDto.RecentOrderDto(
                    poNumber,
                    supplierName,
                    formattedDate,
                    po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO,
                    po.getStatus() != null ? po.getStatus() : "PENDING"
            ));
        }
        dto.setRecentOrders(poDtos);

        // 5. High-Velocity / Top Stocked Formularies
        List<Object[]> topRows = medicineBatchRepository.findTopStockedMedicines();
        List<DashboardStatsDto.TopMedicineDto> topList = new ArrayList<>();
        int rank = 1;
        for (Object[] row : topRows) {
            if (rank > 5) break;
            String medName = (String) row[0];
            Number totalQty = (Number) row[1];
            topList.add(new DashboardStatsDto.TopMedicineDto(
                    rank,
                    medName,
                    totalQty != null ? totalQty.longValue() : 0,
                    "units"
            ));
            rank++;
        }
        dto.setTopMedicines(topList);

        // 6. Dynamic Notifications from medistock.sql table
        dto.setUnreadNotificationsCount(notificationRepository.countByIsReadFalse());

        return dto;
    }

    @Transactional
    public Medicine saveMedicineWithBatch(MedicineRequestDto request) {
        Category category = requireMedicineCategory(request);
        String medicineCode = requireText(request.getMedicineCode(), "Medicine code is required.");
        ensureMedicineCodeAvailable(medicineCode, null);
        Medicine medicine = new Medicine();
        medicine.setMedicineName(requireText(request.getMedicineName(), "Medicine name is required."));
        medicine.setMedicineCode(medicineCode);
        medicine.setGenericName(request.getGenericName());
        medicine.setManufacturer(request.getManufacturer());
        medicine.setCategory(category.getCategoryName());
        medicine.setCategoryEntity(category);
        medicine.setDescription(request.getDescription());
        medicine.setDosage(request.getDosage());
        medicine.setPrescriptionRequired(request.getPrescriptionRequired() != null
            ? request.getPrescriptionRequired()
            : Boolean.FALSE);

        Medicine savedMedicine = medicineRepository.save(medicine);

        if (request.getBatchNumber() != null && !request.getBatchNumber().isBlank()) {
            MedicineBatch batch = medicineBatchRepository.save(applyBatchRequest(
                    new MedicineBatch(), savedMedicine, request));
            recordStockChange(batch, batch.getQuantity(), "Initial stock added with medicine batch.");
        }

        return savedMedicine;
    }

    @Transactional
    public Medicine updateMedicineWithBatch(Integer medicineId, MedicineRequestDto request) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found."));
        Category category = requireMedicineCategory(request);
        String medicineCode = requireText(request.getMedicineCode(), "Medicine code is required.");
        ensureMedicineCodeAvailable(medicineCode, medicineId);

        medicine.setMedicineName(requireText(request.getMedicineName(), "Medicine name is required."));
        medicine.setMedicineCode(medicineCode);
        medicine.setGenericName(request.getGenericName());
        medicine.setManufacturer(request.getManufacturer());
        medicine.setCategory(category.getCategoryName());
        medicine.setCategoryEntity(category);
        medicine.setDescription(request.getDescription());
        medicine.setDosage(request.getDosage());
        medicine.setPrescriptionRequired(Boolean.TRUE.equals(request.getPrescriptionRequired()));
        medicine = medicineRepository.save(medicine);

        List<MedicineBatch> batches = medicineBatchRepository.findByMedicineMedicineId(medicineId);
        MedicineBatch batch;
        if (request.getBatchId() != null) {
            batch = medicineBatchRepository.findById(request.getBatchId())
                    .filter(existing -> existing.getMedicine().getMedicineId().equals(medicineId))
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "The selected batch does not belong to this medicine."));
        } else if (batches.size() == 1) {
            batch = batches.get(0);
        } else if (batches.isEmpty()) {
            batch = new MedicineBatch();
        } else {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Select a specific batch before updating this medicine.");
        }

        Integer previousQuantity = batch.getBatchId() == null ? 0 : batch.getQuantity();
        MedicineBatch savedBatch = medicineBatchRepository.save(applyBatchRequest(batch, medicine, request));
        int quantityChange = savedBatch.getQuantity() - (previousQuantity == null ? 0 : previousQuantity);
        if (quantityChange != 0) {
            recordStockChange(savedBatch, quantityChange,
                    "Stock quantity adjusted while updating medicine batch.");
        }
        return medicine;
    }

    @Transactional
    public void deleteMedicine(Integer medicineId) {
        if (!medicineRepository.existsById(medicineId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found.");
        }
        try {
            entityManager.createNativeQuery("DELETE FROM notification WHERE batch_id IN (SELECT batch_id FROM medicine_batch WHERE medicine_id = :id)")
                    .setParameter("id", medicineId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM stock_log WHERE batch_id IN (SELECT batch_id FROM medicine_batch WHERE medicine_id = :id)")
                    .setParameter("id", medicineId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM sale_item WHERE batch_id IN (SELECT batch_id FROM medicine_batch WHERE medicine_id = :id)")
                    .setParameter("id", medicineId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM purchase_order_item WHERE medicine_id = :id")
                    .setParameter("id", medicineId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM medicine_batch WHERE medicine_id = :id")
                    .setParameter("id", medicineId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM medicine WHERE medicine_id = :id")
                    .setParameter("id", medicineId).executeUpdate();
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not delete medicine: " + exception.getMessage(), exception);
        }
    }

    @Transactional
    public int updateMedicinePricesBySupplier(BulkMedicinePriceRequestDto request) {
        if (request.getSupplierId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a supplier.");
        }
        if (request.getValue() == null || request.getValue().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a non-negative price adjustment.");
        }
        String mode = request.getPricingMode() == null ? "" : request.getPricingMode().trim().toLowerCase();
        if (!mode.equals("markup") && !mode.equals("flat")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose markup or flat selling price.");
        }
        supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier not found."));

        List<MedicineBatch> batches = medicineBatchRepository.findBySupplier_SupplierId(request.getSupplierId());
        for (MedicineBatch batch : batches) {
            BigDecimal sellingPrice = mode.equals("markup")
                    ? (batch.getPurchasePrice() == null ? BigDecimal.ZERO : batch.getPurchasePrice())
                            .multiply(BigDecimal.ONE.add(request.getValue().movePointLeft(2)))
                    : request.getValue();
            batch.setSellingPrice(sellingPrice.setScale(2, RoundingMode.HALF_UP));
        }
        medicineBatchRepository.saveAll(batches);
        return batches.size();
    }

    private Category requireMedicineCategory(MedicineRequestDto request) {
        Category category = request.getCategoryId() != null
                ? categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found."))
                : categoryRepository.findByCategoryName(request.getCategory())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid category."));
        if (request.getCategory() != null
                && !request.getCategory().isBlank()
                && !category.getCategoryName().equals(request.getCategory())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not match the selected category record.");
        }
        return category;
    }

    private void ensureMedicineCodeAvailable(String medicineCode, Integer currentMedicineId) {
        medicineRepository.findByMedicineCodeIgnoreCase(medicineCode)
                .filter(existing -> !existing.getMedicineId().equals(currentMedicineId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "That medicine code is already in use.");
                });
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private MedicineBatch applyBatchRequest(
            MedicineBatch batch,
            Medicine medicine,
            MedicineRequestDto request) {
        if (request.getBatchNumber() == null || request.getBatchNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch number is required.");
        }
        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity cannot be negative.");
        }
        if (request.getReorderLevel() != null && request.getReorderLevel() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reorder level cannot be negative.");
        }
        if ((request.getPurchasePrice() != null && request.getPurchasePrice().signum() < 0)
                || (request.getSellingPrice() != null && request.getSellingPrice().signum() < 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicine prices cannot be negative.");
        }

        String batchNumber = request.getBatchNumber().trim();
        boolean duplicateBatchNumber = batch.getBatchId() == null
                ? medicineBatchRepository.existsByMedicine_MedicineIdAndBatchNumber(
                        medicine.getMedicineId(), batchNumber)
                : medicineBatchRepository.existsByMedicine_MedicineIdAndBatchNumberAndBatchIdNot(
                        medicine.getMedicineId(), batchNumber, batch.getBatchId());
        if (duplicateBatchNumber) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "That batch number is already used for this medicine.");
        }

        batch.setMedicine(medicine);
        batch.setBatchNumber(batchNumber);
        batch.setQuantity(request.getQuantity() == null ? 0 : request.getQuantity());
        batch.setPurchasePrice(request.getPurchasePrice() == null ? BigDecimal.ZERO : request.getPurchasePrice());
        batch.setSellingPrice(request.getSellingPrice() == null ? BigDecimal.ZERO : request.getSellingPrice());
        batch.setExpiryDate(request.getExpiryDate() == null ? LocalDate.now().plusYears(1) : request.getExpiryDate());
        if (batch.getManufacturingDate() == null) {
            batch.setManufacturingDate(LocalDate.now());
        }
        batch.setRackLocation(request.getRackLocation());
        batch.setReorderLevel(request.getReorderLevel() == null ? 10 : request.getReorderLevel());
        batch.setSupplier(request.getSupplierId() == null
                ? null
                : supplierRepository.findById(request.getSupplierId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier not found.")));
        return batch;
    }

    private void recordStockChange(MedicineBatch batch, int quantityChange, String remarks) {
        if (quantityChange == 0) {
            return;
        }
        StockLog stockLog = new StockLog();
        stockLog.setBatch(batch);
        stockLog.setUser(userRepository.findByEmail("admin@medistock.com")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Unable to record stock movement: the admin user is missing.")));
        stockLog.setChangeType(quantityChange > 0 ? "STOCK_IN" : "STOCK_OUT");
        stockLog.setQuantityChanged(Math.abs(quantityChange));
        stockLog.setDateTime(java.time.LocalDateTime.now());
        stockLog.setRemarks(remarks);
        stockLogRepository.save(stockLog);
    }

    @Transactional(readOnly = true)
    public List<MedicineCatalogDto> getAllMedicines() {
        return medicineRepository.findAllCatalogRows();
    }

    @Transactional(readOnly = true)
    public List<InventoryReportDto> getInventoryReport() {
        return medicineRepository.findAllInventoryReportRows();
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications() {
        return notificationRepository.findAllWithDetails().stream()
                .map(notification -> {
                    MedicineBatch batch = notification.getBatch();
                    Medicine medicine = batch == null ? null : batch.getMedicine();
                    return new NotificationDto(
                            notification.getNotificationId(),
                            notification.getNotificationType(),
                            notification.getMessage(),
                            notification.getCreatedAt(),
                            notification.getIsRead(),
                            medicine == null ? null : medicine.getMedicineId(),
                            medicine == null ? null : medicine.getMedicineName(),
                            batch == null ? null : batch.getBatchNumber(),
                            batch == null || batch.getSupplier() == null
                                    ? null
                                    : batch.getSupplier().getSupplierName(),
                            batch == null ? null : batch.getQuantity(),
                            batch == null ? null : batch.getExpiryDate());
                })
                .toList();
    }

    @Transactional
    public long markAllNotificationsAsRead() {
        notificationRepository.markAllAsRead();
        return notificationRepository.countByIsReadFalse();
    }

    @Transactional(readOnly = true)
    public List<InventoryMovementDto> getInventoryMovements() {
        return stockLogRepository.findAllWithMovementDetails().stream()
                .map(log -> new InventoryMovementDto(
                        log.getStockLogId(),
                        log.getDateTime(),
                        log.getBatch().getMedicine().getMedicineId(),
                        log.getBatch().getMedicine().getMedicineName(),
                        log.getBatch().getBatchNumber(),
                        log.getChangeType(),
                        log.getQuantityChanged(),
                        log.getUser().getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getPurchaseOrders() {
        return purchaseOrderRepository.findAllWithDetails().stream()
                .map(this::toPurchaseOrderDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDto getPurchaseOrder(Integer id) {
        PurchaseOrder order = purchaseOrderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase order not found."));
        return toPurchaseOrderDto(order);
    }

    @Transactional
    public PurchaseOrderDto createPurchaseOrder(PurchaseOrderRequestDto request) {
        if (request == null || request.supplierId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A supplier is required.");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one medicine item.");
        }

        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found."));
        User issuer = userRepository.findByEmail("admin@medistock.com")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "Unable to issue purchase order: the admin user is missing."));

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplier(supplier);
        order.setUser(issuer);
        order.setOrderDate(LocalDate.now());
        order.setStatus("PENDING");
        order.setTotalAmount(BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseOrderItemRequestDto requestedItem : request.items()) {
            if (requestedItem == null || requestedItem.medicineId() == null
                    || requestedItem.quantity() == null || requestedItem.quantity() < 1
                    || requestedItem.unitPrice() == null || requestedItem.unitPrice().signum() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Each item needs a medicine, a positive quantity, and a positive unit price.");
            }

            Medicine medicine = medicineRepository.findById(requestedItem.medicineId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "A selected medicine was not found."));
            BigDecimal unitPrice = requestedItem.unitPrice().setScale(2, RoundingMode.HALF_UP);
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(order);
            item.setMedicine(medicine);
            item.setQuantity(requestedItem.quantity());
            item.setUnitPrice(unitPrice);
            order.getItems().add(item);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(requestedItem.quantity())));
        }

        order.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
        return toPurchaseOrderDto(purchaseOrderRepository.save(order));
    }

    @Transactional
    public PurchaseOrderDto updatePurchaseOrderStatus(Integer id, String requestedStatus) {
        if (requestedStatus == null || !List.of("PENDING", "APPROVED", "REJECTED", "PROCESSING", "SHIPPED", "DELIVERED", "RECEIVED", "CANCELLED")
                .contains(requestedStatus.trim().toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid purchase order status.");
        }
        PurchaseOrder order = purchaseOrderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase order not found."));
        order.setStatus(requestedStatus.trim().toUpperCase());
        return toPurchaseOrderDto(purchaseOrderRepository.save(order));
    }

    @Transactional
    public PurchaseOrderDto updatePurchaseOrder(Integer id, PurchaseOrderRequestDto request) {
        PurchaseOrder order = purchaseOrderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase order not found."));

        if (request == null || request.supplierId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A supplier is required.");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one medicine item.");
        }

        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found."));

        order.setSupplier(supplier);
        order.getItems().clear();

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseOrderItemRequestDto requestedItem : request.items()) {
            if (requestedItem == null || requestedItem.medicineId() == null
                    || requestedItem.quantity() == null || requestedItem.quantity() < 1
                    || requestedItem.unitPrice() == null || requestedItem.unitPrice().signum() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Each item needs a medicine, a positive quantity, and a positive unit price.");
            }

            Medicine medicine = medicineRepository.findById(requestedItem.medicineId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "A selected medicine was not found."));
            BigDecimal unitPrice = requestedItem.unitPrice().setScale(2, RoundingMode.HALF_UP);
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(order);
            item.setMedicine(medicine);
            item.setQuantity(requestedItem.quantity());
            item.setUnitPrice(unitPrice);
            order.getItems().add(item);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(requestedItem.quantity())));
        }

        order.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
        return toPurchaseOrderDto(purchaseOrderRepository.save(order));
    }

    @Transactional
    public void deletePurchaseOrder(Integer id) {
        if (!purchaseOrderRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase order not found.");
        }
        entityManager.createNativeQuery("DELETE FROM purchase_order_item WHERE purchase_order_id = :id")
                .setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM purchase_order WHERE purchase_order_id = :id")
                .setParameter("id", id).executeUpdate();
    }

    private PurchaseOrderDto toPurchaseOrderDto(PurchaseOrder order) {
        List<PurchaseOrderDto.PurchaseOrderItemDto> items = order.getItems().stream()
                .map(item -> new PurchaseOrderDto.PurchaseOrderItemDto(
                        item.getMedicine().getMedicineId(),
                        item.getMedicine().getMedicineName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                                .setScale(2, RoundingMode.HALF_UP)))
                .toList();
        String poNumber = "PO-" + order.getOrderDate().getYear() + "-"
                + String.format("%03d", order.getPurchaseOrderId());
        return new PurchaseOrderDto(
                order.getPurchaseOrderId(),
                poNumber,
                order.getSupplier().getSupplierId(),
                order.getSupplier().getSupplierName(),
                order.getSupplier().getContactPerson(),
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getUser().getName(),
                items);
    }

    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Transactional
    public Supplier saveSupplier(Supplier supplier) {
        validateSupplier(supplier);
        supplierRepository.findBySupplierNameIgnoreCase(supplier.getSupplierName())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "A supplier with this name already exists.");
                });
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier updateSupplier(Integer id, Supplier supplierDetails) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found."));
        validateSupplier(supplierDetails);
        supplierRepository.findBySupplierNameIgnoreCase(supplierDetails.getSupplierName())
                .filter(existing -> !existing.getSupplierId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "A supplier with this name already exists.");
                });
        supplier.setSupplierName(supplierDetails.getSupplierName());
        supplier.setContactPerson(supplierDetails.getContactPerson());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setContactNumber(supplierDetails.getContactNumber());
        supplier.setAddress(supplierDetails.getAddress());
        return supplierRepository.save(supplier);
    }

    @Transactional
    public void deleteSupplier(Integer id) {
        if (!supplierRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found.");
        }
        try {
            Integer fallbackSupplierId = supplierRepository.findAll().stream()
                    .map(Supplier::getSupplierId)
                    .filter(sid -> !sid.equals(id))
                    .findFirst()
                    .orElse(null);

            if (fallbackSupplierId != null) {
                entityManager.createNativeQuery("UPDATE medicine_batch SET supplier_id = :fallbackId WHERE supplier_id = :id")
                        .setParameter("fallbackId", fallbackSupplierId)
                        .setParameter("id", id)
                        .executeUpdate();
            } else {
                entityManager.createNativeQuery("DELETE FROM notification WHERE batch_id IN (SELECT batch_id FROM medicine_batch WHERE supplier_id = :id)")
                        .setParameter("id", id).executeUpdate();
                entityManager.createNativeQuery("DELETE FROM stock_log WHERE batch_id IN (SELECT batch_id FROM medicine_batch WHERE supplier_id = :id)")
                        .setParameter("id", id).executeUpdate();
                entityManager.createNativeQuery("DELETE FROM sale_item WHERE batch_id IN (SELECT batch_id FROM medicine_batch WHERE supplier_id = :id)")
                        .setParameter("id", id).executeUpdate();
                entityManager.createNativeQuery("DELETE FROM medicine_batch WHERE supplier_id = :id")
                        .setParameter("id", id).executeUpdate();
            }

            entityManager.createNativeQuery("DELETE poi FROM purchase_order_item poi JOIN purchase_order po ON poi.purchase_order_id = po.purchase_order_id WHERE po.supplier_id = :id")
                    .setParameter("id", id)
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM purchase_order WHERE supplier_id = :id")
                    .setParameter("id", id)
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM supplier WHERE supplier_id = :id")
                    .setParameter("id", id)
                    .executeUpdate();
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not delete supplier: " + exception.getMessage(), exception);
        }
    }

    private void validateSupplier(Supplier supplier) {
        if (supplier == null || supplier.getSupplierName() == null || supplier.getSupplierName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier name is required.");
        }
        supplier.setSupplierName(supplier.getSupplierName().trim());
        supplier.setContactPerson(normalizeSupplierField(supplier.getContactPerson()));
        supplier.setEmail(normalizeSupplierField(supplier.getEmail()));
        supplier.setContactNumber(normalizeSupplierField(supplier.getContactNumber()));
        supplier.setAddress(normalizeSupplierField(supplier.getAddress()));
        if (supplier.getSupplierName().length() > 150
                || (supplier.getContactPerson() != null && supplier.getContactPerson().length() > 150)
                || (supplier.getEmail() != null && supplier.getEmail().length() > 150)
                || (supplier.getContactNumber() != null && supplier.getContactNumber().length() > 20)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more supplier fields exceed the allowed length.");
        }
    }

    private String normalizeSupplierField(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public Category saveCategory(Category category) {
        String categoryName = requireCategoryName(category);
        validateCategoryFields(categoryName, category.getDescription());
        if (categoryRepository.findByCategoryName(categoryName).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A category with this name already exists.");
        }
        category.setCategoryName(categoryName);
        category.setDescription(normalizeDescription(category.getDescription()));
        return categoryRepository.save(category);
    }

    @Transactional
    public Category updateCategory(Integer id, Category categoryDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found."));
        String categoryName = requireCategoryName(categoryDetails);
        validateCategoryFields(categoryName, categoryDetails.getDescription());
        categoryRepository.findByCategoryName(categoryName)
                .filter(existing -> !existing.getCategoryId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "A category with this name already exists.");
                });
        category.setCategoryName(categoryName);
        category.setDescription(normalizeDescription(categoryDetails.getDescription()));
        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Integer id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found.");
        }
        if (medicineRepository.existsByCategoryEntity_CategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This category is assigned to one or more medicines and cannot be deleted.");
        }
        categoryRepository.deleteById(id);
    }

    private String requireCategoryName(Category category) {
        if (category == null || category.getCategoryName() == null || category.getCategoryName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required.");
        }
        return category.getCategoryName().trim();
    }

    private void validateCategoryFields(String categoryName, String description) {
        if (categoryName.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Category name must be 100 characters or fewer.");
        }
        if (description != null && description.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Description must be 255 characters or fewer.");
        }
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
