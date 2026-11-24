package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.CreatePurchaseOrderRequest;
import com.medistock.medistock.dto.UpdateOrderStatusRequest;
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
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class PurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final StockLogRepository stockLogRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptItemRepository goodsReceiptItemRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final RealtimeEventService realtimeEventService;
    private final NotificationService notificationService;
    private final com.medistock.medistock.service.EmailNotificationService emailNotificationService;

    public PurchaseOrderController(PurchaseOrderRepository purchaseOrderRepository,
                                   PurchaseOrderItemRepository purchaseOrderItemRepository,
                                   InventoryBatchRepository inventoryBatchRepository,
                                   StockLogRepository stockLogRepository,
                                   GoodsReceiptRepository goodsReceiptRepository,
                                   GoodsReceiptItemRepository goodsReceiptItemRepository,
                                   AuditLogRepository auditLogRepository,
                                   UserRepository userRepository,
                                   CurrentUserService currentUserService,
                                   AuditService auditService,
                                   RealtimeEventService realtimeEventService,
                                   NotificationService notificationService,
                                   com.medistock.medistock.service.EmailNotificationService emailNotificationService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.stockLogRepository = stockLogRepository;
        this.goodsReceiptRepository = goodsReceiptRepository;
        this.goodsReceiptItemRepository = goodsReceiptItemRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.realtimeEventService = realtimeEventService;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
    }

    /* ================================================================
     *  GET /api/orders — List purchase orders (role-filtered)
     * ================================================================ */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer supplierId,
            @RequestParam(required = false) String scope) {

        // Enforce role-based tenant isolation
        if (currentUserService.hasRole("SUPPLIER")) {
            Optional<Supplier> supplierOpt = currentUserService.getSupplierForCurrentUser();
            if (supplierOpt.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
            }
            Integer loggedInSupplierId = supplierOpt.get().getSupplierId();
            List<PurchaseOrder> supplierOrders;
            if (status != null && !status.isBlank()) {
                String normStatus = status.trim().toUpperCase().replace(" ", "_");
                supplierOrders = purchaseOrderRepository.findBySupplierIdAndStatusOrderByOrderDateDesc(
                        loggedInSupplierId, normStatus);
            } else {
                supplierOrders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(loggedInSupplierId);
            }
            // Step 5 Rule: Suppliers must only see orders that are APPROVED or actively in fulfillment/delivery
            supplierOrders = supplierOrders.stream()
                    .filter(o -> o.getStatus() != null && !List.of("DRAFT", "PENDING_APPROVAL", "PENDING", "REJECTED", "CANCELLED").contains(o.getStatus().toUpperCase()))
                    .toList();
            return ResponseEntity.ok(ApiResponse.ok(supplierOrders));
        }

        // Staff members can view assigned orders for receiving verification
        if (currentUserService.hasRole("STAFF")) {
            // Staff sees orders ready for fulfillment / delivery receiving
            List<PurchaseOrder> receivableOrders = purchaseOrderRepository.findAllByOrderByOrderDateDesc();
            if (status != null && !status.isBlank()) {
                String targetStatus = status.trim().toUpperCase();
                receivableOrders = receivableOrders.stream()
                        .filter(o -> targetStatus.equals(o.getStatus()))
                        .toList();
            }
            return ResponseEntity.ok(ApiResponse.ok(receivableOrders));
        }

        // Pharmacist with scope=mine sees only their own orders
        if ("mine".equalsIgnoreCase(scope) && currentUserService.hasRole("PHARMACIST")) {
            Integer userId = currentUserService.getCurrentUserId();
            List<PurchaseOrder> myOrders = purchaseOrderRepository.findByCreatedByOrderByOrderDateDesc(
                    userId != null ? userId : -1);
            if (status != null && !status.isBlank()) {
                String targetStatus = status.trim().toUpperCase();
                myOrders = myOrders.stream().filter(o -> targetStatus.equals(o.getStatus())).toList();
            }
            return ResponseEntity.ok(ApiResponse.ok(myOrders));
        }

        // Admin and Pharmacist can view all orders or filter
        List<PurchaseOrder> orders;
        if (supplierId != null && status != null && !status.isBlank()) {
            orders = purchaseOrderRepository.findBySupplierIdAndStatusOrderByOrderDateDesc(
                    supplierId, status.trim().toUpperCase());
        } else if (supplierId != null) {
            orders = purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(supplierId);
        } else {
            orders = purchaseOrderRepository.findAllByOrderByOrderDateDesc();
            if (status != null && !status.isBlank()) {
                String targetStatus = status.trim().toUpperCase();
                orders = orders.stream()
                        .filter(o -> targetStatus.equals(o.getStatus()))
                        .toList();
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    /* ================================================================
     *  GET /api/orders/{id} — View single purchase order
     * ================================================================ */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getOrderById(@PathVariable Integer id) {
        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();

        // Enforce strict tenant isolation on individual record access
        if (currentUserService.hasRole("SUPPLIER")) {
            Optional<Supplier> supplierOpt = currentUserService.getSupplierForCurrentUser();
            if (supplierOpt.isEmpty() || !order.getSupplierId().equals(supplierOpt.get().getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Access denied: You can only view orders assigned to your supplier account"));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    /* ================================================================
     *  POST /api/orders — Create purchase order (PHARMACIST ONLY)
     *  Supports saveDraft=true to create as DRAFT, otherwise PENDING_APPROVAL
     * ================================================================ */
    @PostMapping
    @PreAuthorize("hasRole('PHARMACIST')")
    @Transactional
    public ResponseEntity<ApiResponse<PurchaseOrder>> createPurchaseOrder(
            @RequestBody CreatePurchaseOrderRequest req,
            HttpServletRequest request) {

        // Strict role security: Admin must NOT create purchase orders
        if (currentUserService.hasRole("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Admin users cannot create purchase orders. Only Pharmacists can create and submit orders."));
        }

        if (req.getSupplierId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Supplier ID is required"));
        }

        if (req.getItems() == null || req.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("At least one medicine item is required."));
        }

        for (CreatePurchaseOrderRequest.OrderItemDto itemDto : req.getItems()) {
            if (itemDto.getMedicineId() == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Medicine ID is required for all order items."));
            }
            if (itemDto.getQuantity() == null || itemDto.getQuantity() <= 0) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Item quantity must be greater than zero."));
            }
            if (itemDto.getUnitCost() == null || itemDto.getUnitCost().compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Unit cost cannot be negative."));
            }
        }

        Integer userId = currentUserService.getCurrentUserId();

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplierId(req.getSupplierId());
        order.setCreatedBy(userId != null ? userId : 2);
        order.setOrderDate(LocalDate.now());
        order.setExpectedDeliveryDate(req.getExpectedDeliveryDate() != null ? req.getExpectedDeliveryDate() : LocalDate.now().plusDays(7));

        // Support DRAFT vs immediate submission
        boolean isDraft = req.getSaveDraft() != null && req.getSaveDraft();
        order.setStatus(isDraft ? "DRAFT" : "PENDING_APPROVAL");
        order.setNotes(req.getNotes());

        order.setTotalAmount(BigDecimal.ZERO);
        PurchaseOrder saved = purchaseOrderRepository.save(order);

        BigDecimal total = BigDecimal.ZERO;
        List<PurchaseOrderItem> items = new ArrayList<>();

        for (CreatePurchaseOrderRequest.OrderItemDto itemDto : req.getItems()) {
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrderId(saved.getPurchaseOrderId());
            item.setPurchaseOrder(saved);
            item.setMedicineId(itemDto.getMedicineId());
            item.setQuantity(itemDto.getQuantity());
            item.setUnitCost(itemDto.getUnitCost());
            PurchaseOrderItem savedItem = purchaseOrderItemRepository.save(item);
            items.add(savedItem);

            if (itemDto.getUnitCost() != null && itemDto.getQuantity() != null) {
                total = total.add(itemDto.getUnitCost().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
            }
        }
        saved.setTotalAmount(total);
        saved.setItems(items);
        saved = purchaseOrderRepository.save(saved);

        String action = isDraft ? "DRAFT_PURCHASE_ORDER" : "CREATE_PURCHASE_ORDER";
        String statusLabel = isDraft ? "DRAFT" : "PENDING_APPROVAL";
        auditService.logAction(
                userId,
                action,
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId(),
                "Created purchase order #" + saved.getPurchaseOrderId() + " (status: " + statusLabel + ") for supplier #" + saved.getSupplierId(),
                request
        );

        if (!isDraft) {
            // Notify Admin users of pending order
            notificationService.notifyAdmins(
                    "New Purchase Order Submitted",
                    "Pharmacist submitted PO #" + saved.getPurchaseOrderId() + " for Admin review (Total: ₹" + saved.getTotalAmount() + ").",
                    "PURCHASE_ORDER",
                    "PURCHASE_ORDER",
                    saved.getPurchaseOrderId()
            );

            // Broadcast real-time event to Admin dashboard
            realtimeEventService.publishOrderEvent(
                    "PURCHASE_ORDER_SUBMITTED",
                    saved,
                    "New Purchase Order #" + saved.getPurchaseOrderId() + " submitted for approval."
            );
        }

        String msg = isDraft ? "Purchase order saved as draft" : "Purchase order created and submitted for approval";
        return ResponseEntity.ok(ApiResponse.ok(msg, saved));
    }

    /* ================================================================
     *  PUT /api/orders/{id} — Update draft or rejected order (PHARMACIST ONLY)
     * ================================================================ */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PHARMACIST')")
    @Transactional
    public ResponseEntity<ApiResponse<PurchaseOrder>> updatePurchaseOrder(
            @PathVariable Integer id,
            @RequestBody CreatePurchaseOrderRequest req,
            HttpServletRequest request) {

        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();

        // Only DRAFT or REJECTED orders can be edited
        if (!"DRAFT".equals(order.getStatus()) && !"REJECTED".equals(order.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only DRAFT or REJECTED orders can be edited. Current status: " + order.getStatus()));
        }

        // Only the creator can edit their order
        Integer userId = currentUserService.getCurrentUserId();
        if (userId != null && !userId.equals(order.getCreatedBy())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You can only edit orders that you created."));
        }

        if (req.getSupplierId() != null) {
            order.setSupplierId(req.getSupplierId());
        }
        if (req.getExpectedDeliveryDate() != null) {
            order.setExpectedDeliveryDate(req.getExpectedDeliveryDate());
        }
        if (req.getNotes() != null) {
            order.setNotes(req.getNotes());
        }

        // Replace items if provided
        if (req.getItems() != null) {
            purchaseOrderItemRepository.deleteAll(order.getItems());
            order.getItems().clear();

            BigDecimal total = BigDecimal.ZERO;
            List<PurchaseOrderItem> newItems = new ArrayList<>();
            for (CreatePurchaseOrderRequest.OrderItemDto itemDto : req.getItems()) {
                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setPurchaseOrder(order);
                item.setPurchaseOrderId(order.getPurchaseOrderId());
                item.setMedicineId(itemDto.getMedicineId());
                item.setQuantity(itemDto.getQuantity());
                item.setUnitCost(itemDto.getUnitCost());
                newItems.add(item);

                if (itemDto.getUnitCost() != null && itemDto.getQuantity() != null) {
                    total = total.add(itemDto.getUnitCost().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
                }
            }
            order.setTotalAmount(total);
            order.setItems(newItems);
        }

        boolean isDraft = req.getSaveDraft() != null && req.getSaveDraft();
        if (isDraft) {
            order.setStatus("DRAFT");
        }

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        auditService.logAction(
                userId,
                "UPDATE_PURCHASE_ORDER",
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId(),
                "Updated purchase order #" + saved.getPurchaseOrderId(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Purchase order updated successfully", saved));
    }

    /* ================================================================
     *  PATCH /api/orders/{id}/submit — Submit draft/rejected order for approval (PHARMACIST ONLY)
     * ================================================================ */
    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('PHARMACIST')")
    @Transactional
    public ResponseEntity<ApiResponse<PurchaseOrder>> submitOrder(
            @PathVariable Integer id,
            HttpServletRequest request) {

        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();
        if (!"DRAFT".equals(order.getStatus()) && !"REJECTED".equals(order.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only DRAFT or REJECTED orders can be submitted. Current status: " + order.getStatus()));
        }

        if (order.getItems() == null || order.getItems().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cannot submit an order without any items."));
        }

        Integer userId = currentUserService.getCurrentUserId();
        if (userId != null && !userId.equals(order.getCreatedBy())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You can only submit orders that you created."));
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String existingNotes = order.getNotes() != null ? order.getNotes() : "";
        String submitNote = ("REJECTED".equals(order.getStatus()) ? "Resubmitted" : "Submitted") + " for approval on " + timestamp;
        order.setNotes((existingNotes.isBlank() ? "" : existingNotes + "\n") + submitNote);
        order.setStatus("PENDING_APPROVAL");

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        auditService.logAction(
                userId,
                "SUBMIT_PURCHASE_ORDER",
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId(),
                "Submitted purchase order #" + saved.getPurchaseOrderId() + " for admin approval",
                request
        );

        // Notify Admin users
        notificationService.notifyAdmins(
                "Purchase Order Submitted",
                "Pharmacist submitted PO #" + saved.getPurchaseOrderId() + " for Admin review (Total: ₹" + saved.getTotalAmount() + ").",
                "PURCHASE_ORDER",
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId()
        );

        // Broadcast real-time event
        realtimeEventService.publishOrderEvent(
                "PURCHASE_ORDER_SUBMITTED",
                saved,
                "Purchase Order #" + saved.getPurchaseOrderId() + " submitted for approval."
        );

        return ResponseEntity.ok(ApiResponse.ok("Purchase order submitted for approval", saved));
    }

    /* ================================================================
     *  PATCH /api/orders/{id}/approve — Admin approves order
     * ================================================================ */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<PurchaseOrder>> approveOrder(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {

        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();

        // Only PENDING_APPROVAL orders can be approved (prevents duplicate approval)
        String currentStatus = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "";
        if (!"PENDING_APPROVAL".equals(currentStatus) && !"PENDING".equals(currentStatus)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only PENDING_APPROVAL orders can be approved. Current status: " + order.getStatus()));
        }

        Integer adminId = currentUserService.getCurrentUserId();

        // Self-approval check: User cannot approve an order they created
        if (adminId != null && adminId.equals(order.getCreatedBy())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Self-approval is forbidden: You cannot approve a purchase order that you created."));
        }

        String adminName = "Admin";
        if (adminId != null) {
            Optional<User> uOpt = userRepository.findById(adminId);
            if (uOpt.isPresent()) adminName = uOpt.get().getFullName();
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String approvalNote = "Approved by " + adminName + " on " + timestamp;
        if (body != null && body.containsKey("notes") && !body.get("notes").isBlank()) {
            approvalNote += " | " + body.get("notes");
        }

        String existingNotes = order.getNotes() != null ? order.getNotes() : "";
        order.setNotes((existingNotes.isBlank() ? "" : existingNotes + "\n") + approvalNote);
        order.setApprovalNotes(approvalNote);
        order.setStatus("APPROVED");

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        auditService.logAction(
                adminId,
                "APPROVE_PURCHASE_ORDER",
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId(),
                "Approved purchase order #" + saved.getPurchaseOrderId() + " (Total: ₹" + saved.getTotalAmount() + ")",
                request
        );

        // Notify submitting Pharmacist
        if (saved.getCreatedBy() != null) {
            notificationService.sendNotification(
                    saved.getCreatedBy(),
                    "Purchase Order Approved",
                    "Your PO #" + saved.getPurchaseOrderId() + " has been approved by " + adminName + ".",
                    "PURCHASE_ORDER",
                    "PURCHASE_ORDER",
                    saved.getPurchaseOrderId()
            );
        }

        // Notify Supplier of placed purchase order
        List<User> suppliers = userRepository.findByRoleId(4);
        for (User sup : suppliers) {
            emailNotificationService.notifyPurchaseOrderEvent(
                    saved,
                    "PO_APPROVED_SUPPLIER",
                    "New Purchase Order #" + saved.getPurchaseOrderId() + " Placed by MediStock",
                    sup.getUserId(),
                    "Purchase order #" + saved.getPurchaseOrderId() + " has been approved and issued for fulfillment."
            );
        }

        // Broadcast real-time event to Pharmacist and Admin dashboards
        realtimeEventService.publishOrderEvent(
                "PURCHASE_ORDER_APPROVED",
                saved,
                "Purchase Order #" + saved.getPurchaseOrderId() + " approved by Admin."
        );

        return ResponseEntity.ok(ApiResponse.ok("Purchase order approved successfully", saved));
    }

    /* ================================================================
     *  PATCH /api/orders/{id}/reject — Admin rejects order with reason
     * ================================================================ */
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<PurchaseOrder>> rejectOrder(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();

        String currentStatus = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "";
        if (!"PENDING_APPROVAL".equals(currentStatus) && !"PENDING".equals(currentStatus)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only PENDING_APPROVAL orders can be rejected. Current status: " + order.getStatus()));
        }

        if (body == null || !body.containsKey("reason") || body.get("reason").trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("A rejection reason is strictly required before rejecting an order."));
        }
        String reason = body.get("reason").trim();

        Integer adminId = currentUserService.getCurrentUserId();
        String adminName = "Admin";
        if (adminId != null) {
            Optional<User> uOpt = userRepository.findById(adminId);
            if (uOpt.isPresent()) adminName = uOpt.get().getFullName();
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String rejectionNote = "Rejected by " + adminName + " on " + timestamp + ". Reason: " + reason;

        String existingNotes = order.getNotes() != null ? order.getNotes() : "";
        order.setNotes((existingNotes.isBlank() ? "" : existingNotes + "\n") + rejectionNote);
        order.setRejectionReason(reason);
        order.setStatus("REJECTED");

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        auditService.logAction(
                adminId,
                "REJECT_PURCHASE_ORDER",
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId(),
                "Rejected purchase order #" + saved.getPurchaseOrderId() + ". Reason: " + reason,
                request
        );

        // Notify submitting Pharmacist with the exact rejection reason
        if (saved.getCreatedBy() != null) {
            notificationService.sendNotification(
                    saved.getCreatedBy(),
                    "Purchase Order Rejected",
                    "Your PO #" + saved.getPurchaseOrderId() + " was rejected by Admin. Reason: " + reason,
                    "PURCHASE_ORDER",
                    "PURCHASE_ORDER",
                    saved.getPurchaseOrderId()
            );
        }

        // Broadcast real-time event
        realtimeEventService.publishOrderEvent(
                "PURCHASE_ORDER_REJECTED",
                saved,
                "Purchase Order #" + saved.getPurchaseOrderId() + " rejected: " + reason
        );

        return ResponseEntity.ok(ApiResponse.ok("Purchase order rejected", saved));
    }

    /* ================================================================
     *  PATCH /api/orders/{id}/cancel — Cancel order
     * ================================================================ */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<PurchaseOrder>> cancelOrder(
            @PathVariable Integer id,
            HttpServletRequest request) {

        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();
        if ("DELIVERED".equals(order.getStatus()) || "RECEIVED".equals(order.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cannot cancel a delivered/received order."));
        }

        Integer userId = currentUserService.getCurrentUserId();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String existingNotes = order.getNotes() != null ? order.getNotes() : "";
        order.setNotes((existingNotes.isBlank() ? "" : existingNotes + "\n") + "Cancelled on " + timestamp);
        order.setStatus("CANCELLED");

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        auditService.logAction(
                userId,
                "CANCEL_PURCHASE_ORDER",
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId(),
                "Cancelled purchase order #" + saved.getPurchaseOrderId(),
                request
        );

        realtimeEventService.publishOrderEvent(
                "PURCHASE_ORDER_CANCELLED",
                saved,
                "Purchase Order #" + saved.getPurchaseOrderId() + " was cancelled."
        );

        return ResponseEntity.ok(ApiResponse.ok("Purchase order cancelled", saved));
    }

    /* ================================================================
     *  PATCH /api/orders/{id}/status — Update order status (general or supplier dispatch)
     * ================================================================ */
    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<PurchaseOrder>> updateOrderStatus(
            @PathVariable Integer id,
            @RequestBody UpdateOrderStatusRequest req,
            HttpServletRequest request) {

        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();

        // Normalize status string (accepts 'In Transit', 'IN_TRANSIT', 'Dispatched', 'Acknowledged')
        String rawStatus = req.getStatus() != null ? req.getStatus().trim().toUpperCase().replace(" ", "_").replace("-", "_") : "";
        if ("DISPATCHED".equals(rawStatus)) {
            rawStatus = "IN_TRANSIT";
        }

        // Strict supplier tenant check
        if (currentUserService.hasRole("SUPPLIER")) {
            Optional<Supplier> supplierOpt = currentUserService.getSupplierForCurrentUser();
            if (supplierOpt.isEmpty() || !order.getSupplierId().equals(supplierOpt.get().getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Access denied: You can only update orders assigned to your supplier account"));
            }
            if (!List.of("ACKNOWLEDGED", "PROCESSING", "SHIPPED", "IN_TRANSIT").contains(rawStatus)) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "Suppliers may only transition orders to ACKNOWLEDGED, PROCESSING, SHIPPED, or IN_TRANSIT."));
            }
        }

        if (!rawStatus.isBlank()) {
            order.setStatus(rawStatus);
        }

        StringBuilder notesBuilder = new StringBuilder();
        if (order.getNotes() != null && !order.getNotes().isBlank()) {
            notesBuilder.append(order.getNotes());
        }
        if (req.getCarrier() != null || req.getTrackingNo() != null) {
            if (!notesBuilder.isEmpty()) notesBuilder.append(" | ");
            notesBuilder.append("Carrier: ").append(req.getCarrier() != null ? req.getCarrier() : "Standard")
                    .append(" | Tracking: ").append(req.getTrackingNo() != null ? req.getTrackingNo() : "N/A");
        } else if (req.getNotes() != null && !req.getNotes().isBlank()) {
            if (!notesBuilder.isEmpty()) notesBuilder.append(" | ");
            notesBuilder.append(req.getNotes());
        }
        order.setNotes(notesBuilder.toString());

        PurchaseOrder saved = purchaseOrderRepository.save(order);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "UPDATE_ORDER_STATUS",
                "PURCHASE_ORDER",
                saved.getPurchaseOrderId(),
                "Updated purchase order #" + saved.getPurchaseOrderId() + " status to " + saved.getStatus(),
                request
        );

        // Lifecycle event routing & notifications
        if ("ACKNOWLEDGED".equals(saved.getStatus())) {
            // Notify Pharmacist who submitted the order
            if (saved.getCreatedBy() != null) {
                notificationService.sendNotification(
                        saved.getCreatedBy(),
                        "Purchase Order Acknowledged",
                        "Supplier acknowledged PO #" + saved.getPurchaseOrderId() + " and commenced fulfillment.",
                        "PURCHASE_ORDER",
                        "PURCHASE_ORDER",
                        saved.getPurchaseOrderId()
                );
            }
            realtimeEventService.publishOrderEvent(
                    "PURCHASE_ORDER_ACKNOWLEDGED",
                    saved,
                    "Supplier acknowledged PO #" + saved.getPurchaseOrderId() + "."
            );
        } else if (List.of("IN_TRANSIT", "SHIPPED", "ORDERED").contains(saved.getStatus())) {
            // Notify hospital Staff for receiving dock delivery intake
            notificationService.notifyRole(
                    3, // Staff
                    "Delivery In Transit",
                    "Purchase Order #" + saved.getPurchaseOrderId() + " is en route. Prepare receiving dock verification.",
                    "DELIVERY",
                    "PURCHASE_ORDER",
                    saved.getPurchaseOrderId()
            );

            realtimeEventService.publishOrderEvent(
                    "PURCHASE_ORDER_DISPATCHED",
                    saved,
                    "Order #" + saved.getPurchaseOrderId() + " is in transit to hospital receiving."
            );
        } else {
            realtimeEventService.publishOrderEvent(
                    "ORDER_STATUS_UPDATED",
                    saved,
                    "Order #" + saved.getPurchaseOrderId() + " status updated to " + saved.getStatus()
            );
        }

        return ResponseEntity.ok(ApiResponse.ok("Order status updated successfully", saved));
    }

    /* ================================================================
     *  POST /api/orders/{id}/receive — Staff/Pharmacist/Admin verifies delivery
     *  Creates GoodsReceipt, updates batches, logs stock, commits transaction
     * ================================================================ */
    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> receiveGoodsFromOrder(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request) {

        Optional<PurchaseOrder> orderOpt = purchaseOrderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseOrder order = orderOpt.get();

        // Prevent duplicate receipt submissions from increasing stock twice
        if ("DELIVERED".equals(order.getStatus()) || "RECEIVED".equals(order.getStatus()) ||
                goodsReceiptRepository.existsByPurchaseOrderId(id)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This order has already been verified and received into inventory."));
        }

        // Only approved or shipping orders can be received
        if (!List.of("APPROVED", "ORDERED", "SHIPPED", "IN_TRANSIT", "PARTIALLY_RECEIVED").contains(order.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Order must be approved or in transit before receiving goods. Current status: " + order.getStatus()));
        }

        Integer userId = currentUserService.getCurrentUserId();
        LocalDate now = LocalDate.now();
        LocalDate defaultExpiry = now.plusYears(2);

        // 1. Create formal Goods Receipt Header
        String grnNumber = "GRN-" + now.getYear() + "-" + String.format("%04d", (id * 17) % 9000 + 1000);
        GoodsReceipt receipt = new GoodsReceipt();
        receipt.setReceiptNumber(grnNumber);
        receipt.setPurchaseOrderId(id);
        receipt.setReceivedBy(userId != null ? userId : 3);
        receipt.setReceivedAt(LocalDateTime.now());
        receipt.setStatus("COMPLETED");
        receipt.setTotalItems(order.getItems() != null ? order.getItems().size() : 0);

        String dockNotes = body != null && body.containsKey("notes") ? body.get("notes").toString() : "Verified at receiving dock.";
        receipt.setNotes(dockNotes);
        receipt.setHasDiscrepancies(false);

        GoodsReceipt savedReceipt = goodsReceiptRepository.save(receipt);

        // 2. Process each line item into GoodsReceiptItem, InventoryBatch, and StockLog
        List<InventoryBatch> updatedBatches = new ArrayList<>();

        List<?> rawCustomItems = null;
        if (body != null && body.get("items") instanceof List<?>) {
            rawCustomItems = (List<?>) body.get("items");
        }

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (PurchaseOrderItem item : order.getItems()) {
                String batchNumber = "B-" + now.getYear() + "-PO" + id + "-M" + item.getMedicineId();
                LocalDate expiryDate = defaultExpiry;
                int qtyReceived = item.getQuantity() != null ? item.getQuantity() : 0;

                // Match with custom items from verification form if present
                if (rawCustomItems != null) {
                    for (Object obj : rawCustomItems) {
                        if (obj instanceof Map<?, ?> m) {
                            Object mId = m.get("medicineId");
                            Object poItemId = m.get("purchaseOrderItemId");
                            boolean match = (poItemId != null && poItemId.toString().equals(String.valueOf(item.getPurchaseOrderItemId()))) ||
                                            (mId != null && mId.toString().equals(String.valueOf(item.getMedicineId())));
                            if (match) {
                                Object customBatch = m.get("batchNumber");
                                if (customBatch != null && !customBatch.toString().isBlank()) {
                                    batchNumber = customBatch.toString().trim();
                                }
                                Object customExp = m.get("expiryDate");
                                if (customExp != null && !customExp.toString().isBlank()) {
                                    try {
                                        expiryDate = LocalDate.parse(customExp.toString().trim());
                                    } catch (Exception ignored) {}
                                }
                                Object customQty = m.get("receivedQuantity");
                                if (customQty != null) {
                                    try {
                                        int parsed = Integer.parseInt(customQty.toString());
                                        if (parsed > 0) qtyReceived = parsed;
                                    } catch (Exception ignored) {}
                                }
                                break;
                            }
                        }
                    }
                }

                GoodsReceiptItem receiptItem = new GoodsReceiptItem();
                receiptItem.setGoodsReceipt(savedReceipt);
                receiptItem.setPurchaseOrderItemId(item.getPurchaseOrderItemId());
                receiptItem.setMedicineId(item.getMedicineId());
                receiptItem.setQuantityOrdered(item.getQuantity());
                receiptItem.setQuantityReceived(qtyReceived);
                receiptItem.setBatchNumber(batchNumber);
                receiptItem.setExpiryDate(expiryDate);
                receiptItem.setManufacturingDate(now.minusMonths(1));
                receiptItem.setUnitCost(item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO);
                goodsReceiptItemRepository.save(receiptItem);

                // Create or update Inventory Batch
                InventoryBatch batch = new InventoryBatch();
                batch.setMedicineId(item.getMedicineId());
                batch.setSupplierId(order.getSupplierId());
                batch.setBatchNumber(batchNumber);
                batch.setManufacturingDate(now.minusMonths(1));
                batch.setExpiryDate(expiryDate);
                batch.setQuantityReceived(qtyReceived);
                batch.setQuantityAvailable(qtyReceived);
                batch.setPurchaseCost(item.getUnitCost() != null ? item.getUnitCost() : BigDecimal.ZERO);
                batch.setSellingPrice(item.getUnitCost() != null ? item.getUnitCost().multiply(BigDecimal.valueOf(1.35)) : BigDecimal.ZERO);

                InventoryBatch savedBatch = inventoryBatchRepository.save(batch);
                updatedBatches.add(savedBatch);

                // Write immutable stock log record
                StockLog log = new StockLog();
                log.setBatchId(savedBatch.getBatchId());
                log.setUserId(userId != null ? userId : 3);
                log.setTransactionType("RECEIVED");
                log.setQuantityChanged(qtyReceived);
                log.setQuantityBefore(0);
                log.setQuantityAfter(qtyReceived);
                log.setReferenceType("PURCHASE_ORDER");
                log.setReferenceId(order.getPurchaseOrderId());
                log.setNotes("Goods received from Purchase Order #" + order.getPurchaseOrderId() + " under " + grnNumber);
                stockLogRepository.save(log);
            }
        }

        // 3. Mark Order as DELIVERED / RECEIVED
        order.setStatus("DELIVERED");
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String existingNotes = order.getNotes() != null ? order.getNotes() : "";
        order.setNotes((existingNotes.isBlank() ? "" : existingNotes + "\n") + "Stock verified and received under " + grnNumber + " on " + timestamp);
        PurchaseOrder savedOrder = purchaseOrderRepository.save(order);

        // 4. Audit Log
        auditService.logAction(
                userId,
                "RECEIVE_GOODS_ORDER",
                "PURCHASE_ORDER",
                savedOrder.getPurchaseOrderId(),
                "Verified and received goods into inventory for PO #" + savedOrder.getPurchaseOrderId() + " (" + grnNumber + ")",
                request
        );

        // 5. Cross-Role Notifications: Notify Admin and Pharmacist of delivery completion
        notificationService.notifyAdmins(
                "Goods Receipt Verified",
                "Delivery for PO #" + id + " verified into inventory (" + grnNumber + ").",
                "RECEIPT",
                "PURCHASE_ORDER",
                id
        );

        if (savedOrder.getCreatedBy() != null) {
            notificationService.sendNotification(
                    savedOrder.getCreatedBy(),
                    "Goods Receipt Completed",
                    "Your PO #" + id + " has been received and verified by Staff into inventory.",
                    "RECEIPT",
                    "PURCHASE_ORDER",
                    id
            );
        }

        // 6. Broadcast Real-Time WebSocket Events
        realtimeEventService.publishReceiptEvent(
                "RECEIPT_VERIFIED",
                savedReceipt,
                "Goods Receipt #" + grnNumber + " completed for PO #" + id
        );

        realtimeEventService.publishOrderEvent(
                "PURCHASE_ORDER_RECEIVED",
                savedOrder,
                "PO #" + id + " marked DELIVERED and stock updated."
        );

        for (InventoryBatch b : updatedBatches) {
            realtimeEventService.publishInventoryEvent(
                    "STOCK_UPDATED",
                    b.getMedicineId(),
                    b.getBatchId(),
                    "Stock received for medicine ID " + b.getMedicineId()
            );
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("order", savedOrder);
        resp.put("receipt", savedReceipt);
        resp.put("batchesCreated", updatedBatches.size());

        return ResponseEntity.ok(ApiResponse.ok("Goods received and inventory updated successfully", resp));
    }

    /* ================================================================
     *  GET /api/orders/{id}/receipts — Retrieve receipt history
     * ================================================================ */
    @GetMapping("/{id}/receipts")
    public ResponseEntity<ApiResponse<List<GoodsReceipt>>> getOrderReceipts(@PathVariable Integer id) {
        List<GoodsReceipt> receipts = goodsReceiptRepository.findByPurchaseOrderIdOrderByReceivedAtDesc(id);
        return ResponseEntity.ok(ApiResponse.ok(receipts));
    }

    /* ================================================================
     *  GET /api/orders/{id}/history — Retrieve audit approval history
     * ================================================================ */
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getOrderHistory(@PathVariable Integer id) {
        List<AuditLog> history = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("PURCHASE_ORDER", id);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
