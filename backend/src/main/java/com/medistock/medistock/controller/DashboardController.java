package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.entity.Category;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.PurchaseOrderItem;
import com.medistock.medistock.entity.StockLog;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.repository.*;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockLogRepository stockLogRepository;
    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;

    public DashboardController(MedicineRepository medicineRepository,
                               InventoryBatchRepository inventoryBatchRepository,
                               UserRepository userRepository,
                               SupplierRepository supplierRepository,
                               PurchaseOrderRepository purchaseOrderRepository,
                               StockLogRepository stockLogRepository,
                               CategoryRepository categoryRepository,
                               CurrentUserService currentUserService) {
        this.medicineRepository = medicineRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockLogRepository = stockLogRepository;
        this.categoryRepository = categoryRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // If logged-in user is a Supplier, tailor stats strictly to their tenant
        if (currentUserService.hasRole("SUPPLIER")) {
            Optional<Supplier> supplierOpt = currentUserService.getSupplierForCurrentUser();
            if (supplierOpt.isPresent()) {
                Supplier s = supplierOpt.get();
                Integer supplierId = s.getSupplierId();

                long totalOrders = purchaseOrderRepository.countBySupplierId(supplierId);
                long pendingOrders = purchaseOrderRepository.countBySupplierIdAndStatus(supplierId, "PENDING")
                        + purchaseOrderRepository.countBySupplierIdAndStatus(supplierId, "PENDING_APPROVAL");
                long inTransitOrders = purchaseOrderRepository.countBySupplierIdAndStatus(supplierId, "IN_TRANSIT")
                        + purchaseOrderRepository.countBySupplierIdAndStatus(supplierId, "SHIPPED");
                long deliveredOrders = purchaseOrderRepository.countBySupplierIdAndStatus(supplierId, "DELIVERED");

                List<PurchaseOrder> myOrders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(supplierId);
                BigDecimal totalEarnings = myOrders.stream()
                        .map(PurchaseOrder::getTotalAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                stats.put("isSupplier", true);
                stats.put("supplierName", s.getSupplierName());
                stats.put("contactPerson", s.getContactPerson());
                stats.put("totalOrders", totalOrders);
                stats.put("pendingOrders", pendingOrders);
                stats.put("inTransitOrders", inTransitOrders);
                stats.put("deliveredOrders", deliveredOrders);
                stats.put("totalEarnings", totalEarnings);
                stats.put("recentOrders", myOrders.stream().limit(5).toList());

                return ResponseEntity.ok(ApiResponse.ok(stats));
            } else {
                stats.put("isSupplier", true);
                stats.put("supplierName", "Supplier Partner");
                stats.put("contactPerson", "");
                stats.put("totalOrders", 0L);
                stats.put("pendingOrders", 0L);
                stats.put("inTransitOrders", 0L);
                stats.put("deliveredOrders", 0L);
                stats.put("totalEarnings", BigDecimal.ZERO);
                stats.put("recentOrders", Collections.emptyList());

                return ResponseEntity.ok(ApiResponse.ok(stats));
            }
        }

        // ===================================================================
        // 1. ALL 11 REQUIRED ADMIN DASHBOARD STATISTIC CARDS (REAL DATABASE DATA)
        // ===================================================================
        LocalDate today = LocalDate.now();
        List<InventoryBatch> allBatches = inventoryBatchRepository.findAll();
        List<PurchaseOrder> allOrders = purchaseOrderRepository.findAll();

        long totalMedicines = medicineRepository.count();
        long totalCategories = categoryRepository.count();
        Long totalUnitsAvailable = inventoryBatchRepository.calculateTotalUnitsAvailable();
        long totalSuppliers = supplierRepository.countByActiveTrue();

        long pendingPurchaseOrders = allOrders.stream()
                .filter(o -> "PENDING".equalsIgnoreCase(o.getStatus()) || "PENDING_APPROVAL".equalsIgnoreCase(o.getStatus()))
                .count();

        long approvedPurchaseOrders = allOrders.stream()
                .filter(o -> "APPROVED".equalsIgnoreCase(o.getStatus()))
                .count();

        BigDecimal inventoryValue = inventoryBatchRepository.calculateTotalInventoryValue();

        long lowStockCount = allBatches.stream()
                .filter(b -> b.getQuantityAvailable() != null && b.getQuantityAvailable() <= 50)
                .count();

        long expiredCount = allBatches.stream()
                .filter(b -> b.getExpiryDate() != null && b.getExpiryDate().isBefore(today) && b.getQuantityAvailable() > 0)
                .count();

        long expiringSoonCount = allBatches.stream()
                .filter(b -> b.getExpiryDate() != null &&
                        !b.getExpiryDate().isBefore(today) &&
                        !b.getExpiryDate().isAfter(today.plusDays(30)) &&
                        b.getQuantityAvailable() > 0)
                .count();

        long expiring60DaysCount = allBatches.stream()
                .filter(b -> b.getExpiryDate() != null &&
                        !b.getExpiryDate().isBefore(today) &&
                        !b.getExpiryDate().isAfter(today.plusDays(60)) &&
                        b.getQuantityAvailable() > 0)
                .count();

        long totalUsers = userRepository.count();

        stats.put("totalMedicines", totalMedicines);
        stats.put("totalCategories", totalCategories);
        stats.put("totalUnitsAvailable", totalUnitsAvailable != null ? totalUnitsAvailable : 0);
        stats.put("totalSuppliers", totalSuppliers);
        stats.put("pendingPurchaseOrders", pendingPurchaseOrders);
        stats.put("approvedPurchaseOrders", approvedPurchaseOrders);
        stats.put("inventoryValue", inventoryValue != null ? inventoryValue : BigDecimal.ZERO);
        stats.put("lowStockCount", lowStockCount);
        stats.put("expiredCount", expiredCount);
        stats.put("expiringSoonCount", expiringSoonCount);
        stats.put("expiring60DaysCount", expiring60DaysCount);
        stats.put("totalUsers", totalUsers);
        stats.put("totalBatches", allBatches.size());

        // ===================================================================
        // 2. DASHBOARD CHARTS & ANALYTICS (REAL DATABASE AGGREGATIONS)
        // ===================================================================

        // Chart 1 & Chart 3: Monthly purchases & spending & stock received
        List<StockLog> receivedLogs = stockLogRepository.findByTransactionTypeOrderByCreatedAtDesc("RECEIVED");
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, Map<String, Object>> monthAggMap = new LinkedHashMap<>();

        // Generate last 6 months in chronological order
        for (int i = 5; i >= 0; i--) {
            LocalDate mDate = today.minusMonths(i);
            String label = mDate.format(monthFmt);
            Map<String, Object> mData = new HashMap<>();
            mData.put("month", label);
            mData.put("purchasesCount", 0L);
            mData.put("spendAmount", BigDecimal.ZERO);
            mData.put("receivedUnits", 0L);
            monthAggMap.put(label, mData);
        }

        for (PurchaseOrder po : allOrders) {
            if (po.getOrderDate() != null) {
                String poMonth = po.getOrderDate().format(monthFmt);
                if (monthAggMap.containsKey(poMonth)) {
                    Map<String, Object> mData = monthAggMap.get(poMonth);
                    mData.put("purchasesCount", ((Long) mData.get("purchasesCount")) + 1);
                    if (po.getTotalAmount() != null) {
                        BigDecimal currentSpend = (BigDecimal) mData.get("spendAmount");
                        mData.put("spendAmount", currentSpend.add(po.getTotalAmount()));
                    }
                }
            }
        }

        for (StockLog log : receivedLogs) {
            if (log.getCreatedAt() != null) {
                String logMonth = log.getCreatedAt().toLocalDate().format(monthFmt);
                if (monthAggMap.containsKey(logMonth)) {
                    Map<String, Object> mData = monthAggMap.get(logMonth);
                    long units = log.getQuantityChanged() != null ? Math.abs(log.getQuantityChanged()) : 0;
                    mData.put("receivedUnits", ((Long) mData.get("receivedUnits")) + units);
                }
            }
        }

        List<Map<String, Object>> monthlyPurchasesAndReceived = new ArrayList<>(monthAggMap.values());
        stats.put("monthlyPurchasesAndReceived", monthlyPurchasesAndReceived);
        stats.put("monthlySpending", monthlyPurchasesAndReceived);

        // Chart 2: Stock quantity by medicine category
        List<Category> categories = categoryRepository.findAll();
        List<Map<String, Object>> categoryStockList = new ArrayList<>();
        for (Category cat : categories) {
            long totalUnits = allBatches.stream()
                    .filter(b -> b.getMedicine() != null && cat.getCategoryId().equals(b.getMedicine().getCategoryId()))
                    .mapToLong(InventoryBatch::getQuantityAvailable)
                    .sum();

            BigDecimal valuation = allBatches.stream()
                    .filter(b -> b.getMedicine() != null && cat.getCategoryId().equals(b.getMedicine().getCategoryId()))
                    .map(b -> b.getPurchaseCost().multiply(BigDecimal.valueOf(b.getQuantityAvailable())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> catMap = new HashMap<>();
            catMap.put("categoryId", cat.getCategoryId());
            catMap.put("categoryName", cat.getCategoryName());
            catMap.put("stockQuantity", totalUnits);
            catMap.put("valuation", valuation);
            categoryStockList.add(catMap);
        }
        stats.put("stockByCategory", categoryStockList);
        stats.put("categoryDistribution", categoryStockList);

        // Chart 4: Purchase orders by status (Pie / Doughnut Chart)
        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (PurchaseOrder po : allOrders) {
            String s = po.getStatus() != null ? po.getStatus().toUpperCase() : "UNKNOWN";
            statusCounts.put(s, statusCounts.getOrDefault(s, 0L) + 1);
        }
        List<Map<String, Object>> poStatusList = new ArrayList<>();
        statusCounts.forEach((statusKey, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("status", statusKey);
            item.put("count", count);
            poStatusList.add(item);
        });
        stats.put("purchaseOrdersByStatus", poStatusList);

        // Chart 5: Top purchased medicines
        Map<String, Long> medPurchasedCount = new HashMap<>();
        for (PurchaseOrder po : allOrders) {
            if (po.getItems() != null) {
                for (PurchaseOrderItem item : po.getItems()) {
                    String name = item.getMedicine() != null ? item.getMedicine().getMedicineName() : "Medicine #" + item.getMedicineId();
                    long qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    medPurchasedCount.put(name, medPurchasedCount.getOrDefault(name, 0L) + qty);
                }
            }
        }
        List<Map<String, Object>> topMedsList = new ArrayList<>();
        medPurchasedCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .forEach(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("medicineName", e.getKey());
                    m.put("unitsOrdered", e.getValue());
                    topMedsList.add(m);
                });
        stats.put("topPurchasedMedicines", topMedsList);

        // Chart 6: Suppliers by purchase-order count & spending
        List<Supplier> suppliers = supplierRepository.findAll();
        List<Map<String, Object>> supplierStatsList = new ArrayList<>();
        for (Supplier sup : suppliers) {
            long count = allOrders.stream().filter(o -> sup.getSupplierId().equals(o.getSupplierId())).count();
            BigDecimal spent = allOrders.stream()
                    .filter(o -> sup.getSupplierId().equals(o.getSupplierId()))
                    .map(PurchaseOrder::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (count > 0 || sup.getActive()) {
                Map<String, Object> sm = new HashMap<>();
                sm.put("supplierName", sup.getSupplierName());
                sm.put("orderCount", count);
                sm.put("totalSpent", spent);
                supplierStatsList.add(sm);
            }
        }
        supplierStatsList.sort((a, b) -> Long.compare((Long) b.get("orderCount"), (Long) a.get("orderCount")));
        stats.put("suppliersByOrderCount", supplierStatsList.stream().limit(6).toList());

        // Chart 7: Monthly expiry & expired trends
        Map<String, Map<String, Object>> expiryTrendMap = new LinkedHashMap<>();
        for (int i = 0; i < 6; i++) {
            LocalDate futDate = today.plusMonths(i);
            String label = futDate.format(monthFmt);
            Map<String, Object> expItem = new HashMap<>();
            expItem.put("month", label);
            expItem.put("expiringBatches", 0L);
            expItem.put("expiringUnits", 0L);
            expiryTrendMap.put(label, expItem);
        }

        for (InventoryBatch b : allBatches) {
            if (b.getExpiryDate() != null && b.getQuantityAvailable() > 0) {
                String expMonth = b.getExpiryDate().format(monthFmt);
                if (expiryTrendMap.containsKey(expMonth)) {
                    Map<String, Object> expItem = expiryTrendMap.get(expMonth);
                    expItem.put("expiringBatches", ((Long) expItem.get("expiringBatches")) + 1);
                    expItem.put("expiringUnits", ((Long) expItem.get("expiringUnits")) + b.getQuantityAvailable());
                }
            }
        }
        stats.put("monthlyExpiryTrends", new ArrayList<>(expiryTrendMap.values()));

        // Recent transactions
        stats.put("recentTransactions", stockLogRepository.findTop15ByOrderByCreatedAtDesc());

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
