package com.medistock.service.impl;

import com.medistock.dto.response.DashboardStatsResponse;
import com.medistock.entity.Category;
import com.medistock.entity.Supplier;
import com.medistock.enums.MedicineStatus;
import com.medistock.enums.OrderStatus;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.CategoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.StockMovementRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.DashboardService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Value("${app.inventory.expiry-warning-days:60}")
    private int expiryWarningDays;

    public DashboardServiceImpl(MedicineRepository medicineRepository,
                                SupplierRepository supplierRepository,
                                PurchaseOrderRepository purchaseOrderRepository,
                                StockMovementRepository stockMovementRepository,
                                UserRepository userRepository,
                                CategoryRepository categoryRepository) {
        this.medicineRepository = medicineRepository;
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    private void populateInventoryMetrics(DashboardStatsResponse stats) {
        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(expiryWarningDays);

        stats.setTotalMedicines(medicineRepository.countByStatus(MedicineStatus.ACTIVE));
        stats.setTotalStockQuantity(medicineRepository.sumTotalStock(MedicineStatus.ACTIVE));
        stats.setLowStockCount(medicineRepository.countLowStock(MedicineStatus.ACTIVE));
        stats.setOutOfStockCount(medicineRepository.countOutOfStock(MedicineStatus.ACTIVE));
        stats.setNearExpiryCount(medicineRepository.countNearExpiry(today, warningDate, MedicineStatus.ACTIVE));
        stats.setExpiredCount(medicineRepository.countExpired(today, MedicineStatus.ACTIVE));
    }

    private List<Map<String, Object>> getCategoryBreakdown() {
        List<Category> categories = categoryRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();
        for (Category c : categories) {
            Map<String, Object> map = new HashMap<>();
            map.put("categoryName", c.getName());
            long count = medicineRepository.findAll().stream()
                    .filter(m -> m.getCategory() != null && m.getCategory().getId().equals(c.getId()) && m.getStatus() == MedicineStatus.ACTIVE)
                    .count();
            map.put("medicineCount", count);
            list.add(map);
        }
        return list;
    }

    @Override
    public DashboardStatsResponse getAdminDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        populateInventoryMetrics(stats);

        stats.setTotalSuppliers(supplierRepository.count());
        stats.setPendingSuppliers(supplierRepository.countByStatus(SupplierStatus.PENDING));
        stats.setApprovedSuppliers(supplierRepository.countByStatus(SupplierStatus.APPROVED));

        stats.setTotalPurchaseOrders(purchaseOrderRepository.count());
        stats.setPendingOrders(purchaseOrderRepository.countByOrderStatus(OrderStatus.PENDING) + purchaseOrderRepository.countByOrderStatus(OrderStatus.APPROVED));
        stats.setShippedOrders(purchaseOrderRepository.countByOrderStatus(OrderStatus.SHIPPED));
        stats.setCompletedOrders(purchaseOrderRepository.countByOrderStatus(OrderStatus.COMPLETED));
        stats.setTotalPurchasesAmount(purchaseOrderRepository.sumTotalAmount());

        stats.setTotalUsers(userRepository.count());
        stats.setTotalPharmacists(userRepository.countByRole(Role.PHARMACIST));
        stats.setTotalStaff(userRepository.countByRole(Role.STAFF));
        stats.setTotalSupplierUsers(userRepository.countByRole(Role.SUPPLIER));

        stats.setRecentMovements(stockMovementRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5)).getContent());
        stats.setRecentOrders(purchaseOrderRepository.findTop5ByOrderByCreatedAtDesc());
        stats.setStockByCategory(getCategoryBreakdown());

        return stats;
    }

    @Override
    public DashboardStatsResponse getPharmacistDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        populateInventoryMetrics(stats);

        stats.setTotalSuppliers(supplierRepository.countByStatus(SupplierStatus.APPROVED));
        stats.setTotalPurchaseOrders(purchaseOrderRepository.count());
        stats.setPendingOrders(purchaseOrderRepository.countByOrderStatus(OrderStatus.PENDING) + purchaseOrderRepository.countByOrderStatus(OrderStatus.APPROVED));
        stats.setShippedOrders(purchaseOrderRepository.countByOrderStatus(OrderStatus.SHIPPED));
        stats.setCompletedOrders(purchaseOrderRepository.countByOrderStatus(OrderStatus.COMPLETED));
        stats.setTotalPurchasesAmount(purchaseOrderRepository.sumTotalAmount());

        stats.setRecentMovements(stockMovementRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5)).getContent());
        stats.setRecentOrders(purchaseOrderRepository.findTop5ByOrderByCreatedAtDesc());
        stats.setStockByCategory(getCategoryBreakdown());

        return stats;
    }

    @Override
    public DashboardStatsResponse getStaffDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        populateInventoryMetrics(stats);
        stats.setRecentMovements(stockMovementRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5)).getContent());
        return stats;
    }

    @Override
    public DashboardStatsResponse getSupplierDashboardStats(String supplierEmail) {
        Supplier supplier = supplierRepository.findByUserEmail(supplierEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No supplier profile found for user email: " + supplierEmail));

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setSupplierId(supplier.getId());
        stats.setSupplierCompanyName(supplier.getCompanyName());

        stats.setMySuppliedMedicines(medicineRepository.findAllBySupplier_Id(supplier.getId()).size());
        stats.setMyActiveOrders(purchaseOrderRepository.countBySupplierIdAndOrderStatus(supplier.getId(), OrderStatus.APPROVED)
                + purchaseOrderRepository.countBySupplierIdAndOrderStatus(supplier.getId(), OrderStatus.ACCEPTED)
                + purchaseOrderRepository.countBySupplierIdAndOrderStatus(supplier.getId(), OrderStatus.SHIPPED));
        stats.setMyPendingAcceptanceOrders(purchaseOrderRepository.countBySupplierIdAndOrderStatus(supplier.getId(), OrderStatus.APPROVED));
        stats.setMyCompletedOrders(purchaseOrderRepository.countBySupplierIdAndOrderStatus(supplier.getId(), OrderStatus.COMPLETED));
        stats.setMyTotalOrderValue(purchaseOrderRepository.sumTotalAmountBySupplier(supplier.getId()));

        stats.setRecentOrders(purchaseOrderRepository.findTop5BySupplierIdOrderByCreatedAtDesc(supplier.getId()));

        return stats;
    }
}
