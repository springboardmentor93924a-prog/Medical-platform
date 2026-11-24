package com.medistock.medistock.ai.tools;

import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.repository.PurchaseOrderItemRepository;
import com.medistock.medistock.repository.PurchaseOrderRepository;
import com.medistock.medistock.repository.SupplierRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class PurchaseOrderQueryTool {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final SupplierRepository supplierRepository;
    private final CurrentUserService currentUserService;

    public PurchaseOrderQueryTool(
            PurchaseOrderRepository purchaseOrderRepository,
            PurchaseOrderItemRepository purchaseOrderItemRepository,
            SupplierRepository supplierRepository,
            CurrentUserService currentUserService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
        this.supplierRepository = supplierRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves purchase orders filtered by status and tenant boundaries.
     * Admin/Pharmacist: Hospital-wide orders
     * Supplier: Only orders assigned to their supplier profile
     * Staff: Blocked
     */
    public List<Map<String, Object>> getPurchaseOrders(String status, Integer limit) {
        String role = currentUserService != null ? currentUserService.getCurrentUserRole() : "ADMIN";

        if ("STAFF".equalsIgnoreCase(role)) {
            throw new SecurityException("Access Denied: Staff members are not authorized to view purchase orders.");
        }

        int max = (limit != null && limit > 0 && limit <= 50) ? limit : 20;
        List<PurchaseOrder> orders;

        if ("SUPPLIER".equalsIgnoreCase(role)) {
            if (currentUserService == null) {
                throw new SecurityException("Authentication context unavailable.");
            }
            Optional<Supplier> supplierOpt = currentUserService.getSupplierForCurrentUser();
            if (supplierOpt.isEmpty()) {
                throw new SecurityException("Access Denied: No active supplier profile is associated with your authenticated account.");
            }
            Integer mySupplierId = supplierOpt.get().getSupplierId();

            if (status != null && !status.isBlank()) {
                orders = purchaseOrderRepository.findBySupplierIdAndStatusOrderByOrderDateDesc(mySupplierId, status.trim().toUpperCase());
            } else {
                orders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(mySupplierId);
            }
        } else {
            // ADMIN or PHARMACIST
            if (status != null && !status.isBlank()) {
                orders = purchaseOrderRepository.findAllByOrderByOrderDateDesc().stream()
                        .filter(o -> status.equalsIgnoreCase(o.getStatus()))
                        .toList();
            } else {
                orders = purchaseOrderRepository.findAllByOrderByOrderDateDesc();
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        Map<Integer, String> supplierNameCache = new HashMap<>();

        for (PurchaseOrder po : orders.stream().limit(max).toList()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("purchaseOrderId", po.getPurchaseOrderId());
            map.put("orderDate", po.getOrderDate());
            map.put("expectedDeliveryDate", po.getExpectedDeliveryDate());
            map.put("status", po.getStatus());
            map.put("totalAmount", po.getTotalAmount());
            map.put("supplierId", po.getSupplierId());

            String supplierName = supplierNameCache.computeIfAbsent(po.getSupplierId(), id -> {
                Supplier s = supplierRepository.findById(id).orElse(null);
                return s != null ? s.getSupplierName() : "Unknown Supplier";
            });
            map.put("supplierName", supplierName);

            var items = purchaseOrderItemRepository.findByPurchaseOrderId(po.getPurchaseOrderId());
            map.put("lineItemCount", items.size());
            map.put("notes", po.getNotes());
            results.add(map);
        }

        return results;
    }

    /**
     * Retrieves purchase orders awaiting Admin approval.
     * Admin: Can review approval queue
     * Pharmacist: Read-only visibility (cannot self-approve)
     * Staff/Supplier: Blocked
     */
    public Map<String, Object> getPendingApprovals() {
        String role = currentUserService != null ? currentUserService.getCurrentUserRole() : "ADMIN";

        if (!Set.of("ADMIN", "PHARMACIST").contains(role.toUpperCase())) {
            throw new SecurityException("Access Denied: Role [" + role + "] is not authorized to view pending purchase order approvals.");
        }

        List<PurchaseOrder> pending = purchaseOrderRepository.findByStatusIn(List.of("PENDING_APPROVAL"));
        List<Map<String, Object>> list = new ArrayList<>();

        for (PurchaseOrder po : pending) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("purchaseOrderId", po.getPurchaseOrderId());
            map.put("orderDate", po.getOrderDate());
            map.put("totalAmount", po.getTotalAmount());
            map.put("supplierId", po.getSupplierId());
            map.put("createdBy", po.getCreatedBy());
            map.put("notes", po.getNotes());

            Supplier s = supplierRepository.findById(po.getSupplierId()).orElse(null);
            map.put("supplierName", s != null ? s.getSupplierName() : "Supplier #" + po.getSupplierId());
            list.add(map);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("pendingApprovalCount", pending.size());
        response.put("requiresAdminSignature", true);
        response.put("selfApprovalAllowed", false);
        response.put("pendingOrders", list);
        return response;
    }
}

