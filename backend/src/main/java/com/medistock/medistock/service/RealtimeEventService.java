package com.medistock.medistock.service;

import com.medistock.medistock.dto.RealtimeEvent;
import com.medistock.medistock.entity.GoodsReceipt;
import com.medistock.medistock.entity.Notification;
import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.StockDiscrepancy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RealtimeEventService {

    private static final Logger log = LoggerFactory.getLogger(RealtimeEventService.class);

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeEventService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Broadcasts purchase order lifecycle changes (SUBMITTED, APPROVED, REJECTED, ORDERED, IN_TRANSIT, RECEIVED)
     */
    public void publishOrderEvent(String eventType, PurchaseOrder order, String message) {
        try {
            Map<String, Object> summary = new HashMap<>();
            summary.put("purchaseOrderId", order.getPurchaseOrderId());
            summary.put("supplierId", order.getSupplierId());
            summary.put("createdBy", order.getCreatedBy());
            summary.put("status", order.getStatus());
            summary.put("totalAmount", order.getTotalAmount());
            summary.put("orderDate", order.getOrderDate());
            summary.put("notes", order.getNotes());
            summary.put("rejectionReason", order.getRejectionReason());
            summary.put("approvalNotes", order.getApprovalNotes());

            RealtimeEvent event = new RealtimeEvent(
                    eventType,
                    "ALL",
                    "PURCHASE_ORDER",
                    order.getPurchaseOrderId(),
                    message,
                    summary
            );

            // Broadcast to general order topic
            messagingTemplate.convertAndSend("/topic/orders", event);

            // Dedicated topics for role-specific dashboard listeners
            messagingTemplate.convertAndSend("/topic/admin/orders", event);
            messagingTemplate.convertAndSend("/topic/pharmacist/orders", event);
            messagingTemplate.convertAndSend("/topic/staff/orders", event);

            log.info("[WebSocket Event] Published {} for Order #{}", eventType, order.getPurchaseOrderId());
        } catch (Exception ex) {
            log.warn("[WebSocket Event] Failed to publish order event: {}", ex.getMessage());
        }
    }

    /**
     * Broadcasts verified goods receipt events when deliveries are confirmed
     */
    public void publishReceiptEvent(String eventType, GoodsReceipt receipt, String message) {
        try {
            Map<String, Object> summary = new HashMap<>();
            summary.put("receiptId", receipt.getReceiptId());
            summary.put("receiptNumber", receipt.getReceiptNumber());
            summary.put("purchaseOrderId", receipt.getPurchaseOrderId());
            summary.put("receivedBy", receipt.getReceivedBy());
            summary.put("status", receipt.getStatus());
            summary.put("totalItems", receipt.getTotalItems());
            summary.put("hasDiscrepancies", receipt.getHasDiscrepancies());

            RealtimeEvent event = new RealtimeEvent(
                    eventType,
                    "ALL",
                    "RECEIPT",
                    receipt.getReceiptId(),
                    message,
                    summary
            );

            messagingTemplate.convertAndSend("/topic/deliveries", event);
            messagingTemplate.convertAndSend("/topic/inventory", event);
            messagingTemplate.convertAndSend("/topic/orders", event);

            log.info("[WebSocket Event] Published {} for Receipt #{}", eventType, receipt.getReceiptNumber());
        } catch (Exception ex) {
            log.warn("[WebSocket Event] Failed to publish receipt event: {}", ex.getMessage());
        }
    }

    /**
     * Broadcasts stock level and batch status updates
     */
    public void publishInventoryEvent(String eventType, Integer medicineId, Integer batchId, String message) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("medicineId", medicineId);
            data.put("batchId", batchId);

            RealtimeEvent event = new RealtimeEvent(
                    eventType,
                    "ALL",
                    "BATCH",
                    batchId,
                    message,
                    data
            );

            messagingTemplate.convertAndSend("/topic/inventory", event);
            log.info("[WebSocket Event] Published {} for Medicine ID {}, Batch ID {}", eventType, medicineId, batchId);
        } catch (Exception ex) {
            log.warn("[WebSocket Event] Failed to publish inventory event: {}", ex.getMessage());
        }
    }

    /**
     * Broadcasts physical count discrepancies reported by Staff
     */
    public void publishDiscrepancyEvent(String eventType, StockDiscrepancy discrepancy, String message) {
        try {
            Map<String, Object> summary = new HashMap<>();
            summary.put("discrepancyId", discrepancy.getDiscrepancyId());
            summary.put("medicineId", discrepancy.getMedicineId());
            summary.put("batchId", discrepancy.getBatchId());
            summary.put("expectedQuantity", discrepancy.getExpectedQuantity());
            summary.put("countedQuantity", discrepancy.getCountedQuantity());
            summary.put("discrepancy", discrepancy.getDiscrepancy());
            summary.put("reason", discrepancy.getReason());
            summary.put("reportedBy", discrepancy.getReportedBy());
            summary.put("status", discrepancy.getStatus());

            RealtimeEvent event = new RealtimeEvent(
                    eventType,
                    "PHARMACIST_AND_ADMIN",
                    "DISCREPANCY",
                    discrepancy.getDiscrepancyId(),
                    message,
                    summary
            );

            messagingTemplate.convertAndSend("/topic/discrepancies", event);
            messagingTemplate.convertAndSend("/topic/inventory", event);

            log.info("[WebSocket Event] Published {} for Discrepancy #{}", eventType, discrepancy.getDiscrepancyId());
        } catch (Exception ex) {
            log.warn("[WebSocket Event] Failed to publish discrepancy event: {}", ex.getMessage());
        }
    }

    /**
     * Sends private and general notifications to connected users
     */
    public void publishNotification(Integer userId, String email, Notification notification) {
        try {
            RealtimeEvent event = new RealtimeEvent(
                    "NOTIFICATION",
                    "USER",
                    "NOTIFICATION",
                    notification.getNotificationId(),
                    notification.getMessage(),
                    notification
            );

            // General notification topic
            messagingTemplate.convertAndSend("/topic/notifications", event);

            // Targeted user channel by numeric userId
            if (userId != null) {
                messagingTemplate.convertAndSend("/topic/notifications/" + userId, event);
            }

            // Targeted private user queue if email is available
            if (email != null && !email.isBlank()) {
                messagingTemplate.convertAndSendToUser(email, "/queue/notifications", event);
            }

            log.info("[WebSocket Event] Published notification #{} to User {}", notification.getNotificationId(), userId);
        } catch (Exception ex) {
            log.warn("[WebSocket Event] Failed to publish notification: {}", ex.getMessage());
        }
    }
}

