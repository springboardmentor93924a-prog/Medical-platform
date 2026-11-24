package com.medistock.medistock.ai.tools;

import com.medistock.medistock.entity.GoodsReceipt;
import com.medistock.medistock.entity.GoodsReceiptItem;
import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.repository.GoodsReceiptItemRepository;
import com.medistock.medistock.repository.GoodsReceiptRepository;
import com.medistock.medistock.repository.PurchaseOrderRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class DeliveryQueryTool {

    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptItemRepository goodsReceiptItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CurrentUserService currentUserService;

    public DeliveryQueryTool(
            GoodsReceiptRepository goodsReceiptRepository,
            GoodsReceiptItemRepository goodsReceiptItemRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            CurrentUserService currentUserService) {
        this.goodsReceiptRepository = goodsReceiptRepository;
        this.goodsReceiptItemRepository = goodsReceiptItemRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves goods receipt and delivery verification history.
     * Supplier: Scoped strictly to purchase orders belonging to their supplier profile.
     * Admin/Pharmacist/Staff: Hospital-wide delivery and receiving records.
     */
    public List<Map<String, Object>> getDeliveryHistory(Integer purchaseOrderId) {
        String role = currentUserService != null ? currentUserService.getCurrentUserRole() : "ADMIN";

        List<GoodsReceipt> receipts;

        if ("SUPPLIER".equalsIgnoreCase(role)) {
            if (currentUserService == null) {
                throw new SecurityException("Authentication context unavailable.");
            }
            Optional<Supplier> supplierOpt = currentUserService.getSupplierForCurrentUser();
            if (supplierOpt.isEmpty()) {
                throw new SecurityException("Access Denied: No active supplier profile is associated with your authenticated account.");
            }
            Integer mySupplierId = supplierOpt.get().getSupplierId();

            if (purchaseOrderId != null) {
                PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId).orElse(null);
                if (po == null || !mySupplierId.equals(po.getSupplierId())) {
                    throw new SecurityException("Access Denied: You cannot view delivery records for orders belonging to other suppliers.");
                }
                receipts = goodsReceiptRepository.findByPurchaseOrderIdOrderByReceivedAtDesc(purchaseOrderId);
            } else {
                List<PurchaseOrder> myOrders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(mySupplierId);
                receipts = new ArrayList<>();
                for (PurchaseOrder po : myOrders) {
                    receipts.addAll(goodsReceiptRepository.findByPurchaseOrderIdOrderByReceivedAtDesc(po.getPurchaseOrderId()));
                }
            }
        } else {
            // ADMIN, PHARMACIST, STAFF
            if (purchaseOrderId != null) {
                receipts = goodsReceiptRepository.findByPurchaseOrderIdOrderByReceivedAtDesc(purchaseOrderId);
            } else {
                receipts = goodsReceiptRepository.findAllByOrderByReceivedAtDesc().stream().limit(25).toList();
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (GoodsReceipt gr : receipts) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("receiptId", gr.getReceiptId());
            map.put("receiptNumber", gr.getReceiptNumber());
            map.put("purchaseOrderId", gr.getPurchaseOrderId());
            map.put("receivedAt", gr.getReceivedAt());
            map.put("status", gr.getStatus());
            map.put("totalItems", gr.getTotalItems());
            map.put("hasDiscrepancies", gr.getHasDiscrepancies());
            map.put("notes", gr.getNotes());

            List<GoodsReceiptItem> items = goodsReceiptItemRepository.findByGoodsReceipt_ReceiptId(gr.getReceiptId());
            map.put("lineItemCount", items.size());
            results.add(map);
        }

        return results;
    }
}

