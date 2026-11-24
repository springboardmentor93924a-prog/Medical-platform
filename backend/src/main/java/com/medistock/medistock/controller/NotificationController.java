package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.entity.InventoryBatch;
import com.medistock.medistock.entity.Notification;
import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.repository.InventoryBatchRepository;
import com.medistock.medistock.repository.NotificationRepository;
import com.medistock.medistock.repository.PurchaseOrderRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationRepository notificationRepository,
                                  InventoryBatchRepository inventoryBatchRepository,
                                  PurchaseOrderRepository purchaseOrderRepository,
                                  CurrentUserService currentUserService) {
        this.notificationRepository = notificationRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Transactional
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }

        // Auto-sync system inventory and purchase alerts for admin
        syncSystemAlerts(userId);

        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable Integer id) {
        Optional<Notification> notifOpt = notificationRepository.findById(id);
        if (notifOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Notification notif = notifOpt.get();
        Integer currentUserId = currentUserService.getCurrentUserId();
        if (currentUserId == null || (!currentUserId.equals(notif.getUserId()) && !currentUserService.hasRole("ADMIN"))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Access denied: You cannot modify another user's notifications"));
        }

        notif.setRead(true);
        notif.setReadAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notif);

        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", saved));
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }

        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : list) {
            if (!Boolean.TRUE.equals(n.getRead())) {
                n.setRead(true);
                n.setReadAt(LocalDateTime.now());
                notificationRepository.save(n);
            }
        }
        return ResponseEntity.ok(ApiResponse.<Void>ok("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Integer id) {
        Optional<Notification> notifOpt = notificationRepository.findById(id);
        if (notifOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Notification notif = notifOpt.get();
        Integer currentUserId = currentUserService.getCurrentUserId();
        if (currentUserId == null || (!currentUserId.equals(notif.getUserId()) && !currentUserService.hasRole("ADMIN"))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Access denied: You cannot delete another user's notifications"));
        }

        notificationRepository.delete(notif);
        return ResponseEntity.ok(ApiResponse.<Void>ok("Notification deleted", null));
    }

    /**
     * Sensible deduplicated alert creation for low stock, expiry, and pending approval orders.
     * High-performance single-pass in-memory deduplication (O(1) lookups).
     */
    private void syncSystemAlerts(Integer userId) {
        LocalDate today = LocalDate.now();

        // 1. Fetch user's existing notifications ONCE to avoid N+1 query loop
        List<Notification> userExisting = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Set<String> unreadKeys = new HashSet<>();
        for (Notification n : userExisting) {
            if (!Boolean.TRUE.equals(n.getRead()) && n.getRelatedEntityType() != null && n.getRelatedEntityId() != null) {
                unreadKeys.add(n.getRelatedEntityType() + ":" + n.getRelatedEntityId() + ":" + n.getNotificationType());
            }
        }

        List<Notification> toSave = new ArrayList<>();

        // 2. Pending Approval Purchase Orders (Admin only should receive approval alerts)
        if (currentUserService.hasRole("ADMIN")) {
            List<PurchaseOrder> pendingOrders = purchaseOrderRepository.findAll().stream()
                    .filter(o -> "PENDING_APPROVAL".equalsIgnoreCase(o.getStatus()) || "PENDING".equalsIgnoreCase(o.getStatus()))
                    .toList();

            for (PurchaseOrder po : pendingOrders) {
                String key = "PURCHASE_ORDER:" + po.getPurchaseOrderId() + ":PURCHASE_APPROVAL";
                if (!unreadKeys.contains(key)) {
                    Notification n = new Notification();
                    n.setUserId(userId);
                    n.setTitle("Purchase Order Awaiting Approval");
                    n.setMessage("PO #" + po.getPurchaseOrderId() + " (" + (po.getSupplier() != null ? po.getSupplier().getSupplierName() : "Supplier") +
                            ") for $" + po.getTotalAmount() + " requires administrative review and approval.");
                    n.setNotificationType("PURCHASE_APPROVAL");
                    n.setRelatedEntityType("PURCHASE_ORDER");
                    n.setRelatedEntityId(po.getPurchaseOrderId());
                    n.setRead(false);
                    toSave.add(n);
                    unreadKeys.add(key);
                }
            }
        }

        // 3. Low-Stock Batches (Admin and Pharmacist)
        if (currentUserService.hasRole("ADMIN") || currentUserService.hasRole("PHARMACIST")) {
            List<InventoryBatch> lowStock = inventoryBatchRepository.findByQuantityAvailableLessThanEqualOrderByQuantityAvailableAsc(50);
            for (InventoryBatch b : lowStock) {
                String key = "BATCH:" + b.getBatchId() + ":LOW_STOCK";
                if (!unreadKeys.contains(key)) {
                    String medName = b.getMedicine() != null ? b.getMedicine().getMedicineName() : "Medicine";
                    Notification n = new Notification();
                    n.setUserId(userId);
                    n.setTitle("Low Stock Alert: " + medName);
                    n.setMessage("Batch " + b.getBatchNumber() + " has only " + b.getQuantityAvailable() +
                            " units remaining (below safety threshold 50). Consider creating a purchase order.");
                    n.setNotificationType("LOW_STOCK");
                    n.setRelatedEntityType("BATCH");
                    n.setRelatedEntityId(b.getBatchId());
                    n.setRead(false);
                    toSave.add(n);
                    unreadKeys.add(key);
                }
            }

            // 4. Expired & Expiring Batches
            List<InventoryBatch> expiring = inventoryBatchRepository.findAll();
            for (InventoryBatch b : expiring) {
                if (b.getExpiryDate() == null || b.getQuantityAvailable() <= 0) continue;

                long days = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                if (days <= 30) {
                    String type = days < 0 ? "BATCH_EXPIRED" : "BATCH_EXPIRING";
                    String key = "BATCH:" + b.getBatchId() + ":" + type;
                    if (!unreadKeys.contains(key)) {
                        String medName = b.getMedicine() != null ? b.getMedicine().getMedicineName() : "Medicine";
                        Notification n = new Notification();
                        n.setUserId(userId);
                        if (days < 0) {
                            n.setTitle("Expired Stock: " + medName);
                            n.setMessage("Batch " + b.getBatchNumber() + " with " + b.getQuantityAvailable() +
                                    " units expired " + Math.abs(days) + " days ago. Quarantine or dispose immediately.");
                        } else {
                            n.setTitle("Expiring Soon (" + days + "d): " + medName);
                            n.setMessage("Batch " + b.getBatchNumber() + " with " + b.getQuantityAvailable() +
                                    " units expires on " + b.getExpiryDate() + " (" + days + " days remaining).");
                        }
                        n.setNotificationType(type);
                        n.setRelatedEntityType("BATCH");
                        n.setRelatedEntityId(b.getBatchId());
                        n.setRead(false);
                        toSave.add(n);
                        unreadKeys.add(key);
                    }
                }
            }
        }

        if (!toSave.isEmpty()) {
            notificationRepository.saveAll(toSave);
        }
    }
}
