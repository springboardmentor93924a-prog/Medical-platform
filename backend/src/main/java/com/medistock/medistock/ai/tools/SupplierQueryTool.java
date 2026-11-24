package com.medistock.medistock.ai.tools;

import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.repository.PurchaseOrderRepository;
import com.medistock.medistock.repository.SupplierRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class SupplierQueryTool {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CurrentUserService currentUserService;

    public SupplierQueryTool(
            SupplierRepository supplierRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            CurrentUserService currentUserService) {
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.currentUserService = currentUserService;
    }

    public List<Map<String, Object>> getSupplierSummary() {
        String role = currentUserService.getCurrentUserRole();

        // 1. Staff members are blocked from wholesale supplier directory & purchasing
        if ("STAFF".equalsIgnoreCase(role)) {
            throw new SecurityException("Access Denied: Staff members are not authorized to view wholesale supplier directory or purchase order summaries.");
        }

        // 2. Supplier Role: Enforce strict tenant isolation (view own company & orders only)
        if ("SUPPLIER".equalsIgnoreCase(role)) {
            Optional<Supplier> supplierOpt = currentUserService.getSupplierForCurrentUser();
            if (supplierOpt.isEmpty()) {
                throw new SecurityException("Access Denied: No active wholesale supplier profile is associated with your authenticated account.");
            }

            Supplier mySupplier = supplierOpt.get();
            Integer supplierId = mySupplier.getSupplierId();

            List<PurchaseOrder> myOrders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(supplierId);
            long activeCount = myOrders.stream()
                    .filter(o -> List.of("PENDING_APPROVAL", "APPROVED", "ORDERED", "SHIPPED").contains(o.getStatus()))
                    .count();

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("supplierId", mySupplier.getSupplierId());
            map.put("supplierName", mySupplier.getSupplierName());
            map.put("contactPerson", mySupplier.getContactPerson());
            map.put("email", mySupplier.getEmail());
            map.put("phone", mySupplier.getPhone());
            map.put("activePurchaseOrders", activeCount);

            return List.of(map);
        }

        // 3. Admin and Pharmacist: Hospital-wide directory
        List<Supplier> suppliers = supplierRepository.findAll();
        List<PurchaseOrder> activeOrders = purchaseOrderRepository.findByStatusIn(List.of("PENDING_APPROVAL", "APPROVED", "ORDERED", "SHIPPED"));

        Map<Integer, Long> pendingCountBySupplier = new HashMap<>();
        for (PurchaseOrder po : activeOrders) {
            if (po.getSupplierId() != null) {
                pendingCountBySupplier.put(po.getSupplierId(), pendingCountBySupplier.getOrDefault(po.getSupplierId(), 0L) + 1);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Supplier s : suppliers) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("supplierId", s.getSupplierId());
            map.put("supplierName", s.getSupplierName());
            map.put("contactPerson", s.getContactPerson());
            map.put("email", s.getEmail());
            map.put("phone", s.getPhone());
            map.put("activePurchaseOrders", pendingCountBySupplier.getOrDefault(s.getSupplierId(), 0L));
            result.add(map);
        }

        return result;
    }
}

