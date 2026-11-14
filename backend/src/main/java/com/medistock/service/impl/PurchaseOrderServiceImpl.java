package com.medistock.service.impl;

import com.medistock.dto.request.OrderStatusUpdateRequest;
import com.medistock.dto.request.PurchaseOrderItemRequest;
import com.medistock.dto.request.PurchaseOrderRequest;
import com.medistock.dto.request.ReceiveStockRequest;
import com.medistock.entity.Medicine;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.PurchaseOrderItem;
import com.medistock.entity.StockMovement;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.enums.MovementType;
import com.medistock.enums.NotificationType;
import com.medistock.enums.OrderStatus;
import com.medistock.enums.PaymentStatus;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.ForbiddenException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.StockMovementRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.NotificationService;
import com.medistock.service.PurchaseOrderService;
import com.medistock.service.SupplierService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Random;

@Service
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private static final Random RANDOM = new SecureRandom();

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final SupplierService supplierService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public PurchaseOrderServiceImpl(
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository,
            MedicineRepository medicineRepository,
            StockMovementRepository stockMovementRepository,
            UserRepository userRepository,
            SupplierService supplierService,
            NotificationService notificationService,
            AuditLogService auditLogService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
        this.supplierService = supplierService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    private String generatePoNumber() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = 1000 + RANDOM.nextInt(9000);
        return "PO-" + dateStr + "-" + rand;
    }

    @Override
    @Transactional
    public PurchaseOrder createOrder(PurchaseOrderRequest request, String userEmail) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        if (supplier.getStatus() != SupplierStatus.APPROVED) {
            throw new BadRequestException("Purchase orders can only be assigned to approved suppliers. Current status: " + supplier.getStatus());
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(generatePoNumber());
        po.setSupplier(supplier);
        po.setOrderDate(LocalDate.now());
        po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        po.setOrderStatus(OrderStatus.PENDING);
        po.setPaymentStatus(PaymentStatus.PENDING);
        po.setNotes(request.getNotes());
        po.setCreatedBy(user);

        BigDecimal grandTotal = BigDecimal.ZERO;

        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + itemReq.getMedicineId()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setMedicine(medicine);
            item.setRequestedQuantity(itemReq.getRequestedQuantity());
            item.setReceivedQuantity(0);
            item.setUnitPrice(itemReq.getUnitPrice());
            item.setSubtotal(itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getRequestedQuantity())));

            po.addItem(item);
            grandTotal = grandTotal.add(item.getSubtotal());
        }

        po.setTotalAmount(grandTotal);
        PurchaseOrder savedPo = purchaseOrderRepository.save(po);

        // Notify supplier
        if (supplier.getUser() != null) {
            notificationService.sendNotification(
                    supplier.getUser(),
                    Role.SUPPLIER,
                    "New Purchase Order Requisition: " + savedPo.getPoNumber(),
                    "A new purchase order " + savedPo.getPoNumber() + " with total amount $" + grandTotal + " has been initiated for your review.",
                    NotificationType.PO_UPDATE
            );
        }

        String entityId = savedPo.getId() != null ? savedPo.getId().toString() : "N/A";
        auditLogService.log(userEmail, user != null && user.getRole() != null ? user.getRole().name() : "PHARMACIST", "CREATE_PO", "PurchaseOrder", entityId,
                "Created purchase order " + savedPo.getPoNumber() + " for supplier " + supplier.getCompanyName());

        return savedPo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrder> getAllOrders(Long supplierId, OrderStatus status, Pageable pageable) {
        return purchaseOrderRepository.filterOrders(supplierId, status, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrder getOrderById(Long id, String userEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        supplierService.verifySupplierAccess(userEmail, po.getSupplier().getId());
        return po;
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrder getOrderByPoNumber(String poNumber, String userEmail) {
        PurchaseOrder po = purchaseOrderRepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with number: " + poNumber));

        supplierService.verifySupplierAccess(userEmail, po.getSupplier().getId());
        return po;
    }

    @Override
    @Transactional
    public PurchaseOrder approveOrder(Long id, String userEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        if (po.getOrderStatus() != OrderStatus.PENDING && po.getOrderStatus() != OrderStatus.DRAFT) {
            throw new BadRequestException("Order cannot be approved from status: " + po.getOrderStatus());
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);
        po.setOrderStatus(OrderStatus.APPROVED);
        po.setApprovedBy(user);

        PurchaseOrder updated = purchaseOrderRepository.save(po);

        if (po.getSupplier().getUser() != null) {
            notificationService.sendNotification(
                    po.getSupplier().getUser(),
                    Role.SUPPLIER,
                    "Purchase Order Approved: " + po.getPoNumber(),
                    "Purchase Order " + po.getPoNumber() + " has been approved by the pharmacy administrator. Please review and Accept or Reject the order.",
                    NotificationType.PO_UPDATE
            );
        }

        auditLogService.log(userEmail, user != null && user.getRole() != null ? user.getRole().name() : "ADMIN", "APPROVE_PO", "PurchaseOrder", id.toString(),
                "Approved purchase order " + po.getPoNumber());

        return updated;
    }

    @Override
    @Transactional
    public PurchaseOrder rejectOrderByAdmin(Long id, String reason, String userEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        po.setOrderStatus(OrderStatus.REJECTED);
        if (reason != null && !reason.isBlank()) {
            po.setNotes(po.getNotes() != null ? po.getNotes() + " | Admin Rejection Note: " + reason : reason);
        }

        PurchaseOrder updated = purchaseOrderRepository.save(po);
        auditLogService.log(userEmail, "ADMIN", "REJECT_PO", "PurchaseOrder", id.toString(),
                "Admin rejected purchase order " + po.getPoNumber());

        return updated;
    }

    @Override
    @Transactional
    public PurchaseOrder acceptOrderBySupplier(Long id, String notes, String supplierEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        supplierService.verifySupplierAccess(supplierEmail, po.getSupplier().getId());

        if (po.getOrderStatus() != OrderStatus.APPROVED && po.getOrderStatus() != OrderStatus.SENT_TO_SUPPLIER && po.getOrderStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Order cannot be accepted from current status: " + po.getOrderStatus() + ". Expected APPROVED or PENDING.");
        }

        po.setOrderStatus(OrderStatus.SUPPLIER_ACCEPTED);
        if (notes != null && !notes.isBlank()) {
            po.setNotes(po.getNotes() != null ? po.getNotes() + " | Supplier Acceptance Note: " + notes : notes);
        }

        PurchaseOrder updated = purchaseOrderRepository.save(po);

        // Notify Admin and Pharmacist
        notificationService.notifyRole(
                Role.PHARMACIST,
                "Supplier Accepted PO: " + po.getPoNumber(),
                "Supplier " + po.getSupplier().getCompanyName() + " accepted purchase order " + po.getPoNumber() + " and confirmed fulfillment.",
                NotificationType.PO_UPDATE
        );
        notificationService.notifyRole(
                Role.ADMIN,
                "Supplier Accepted PO: " + po.getPoNumber(),
                "Supplier " + po.getSupplier().getCompanyName() + " accepted purchase order " + po.getPoNumber() + ".",
                NotificationType.PO_UPDATE
        );

        auditLogService.log(supplierEmail, Role.SUPPLIER.name(), "SUPPLIER_ACCEPT_PO", "PurchaseOrder", id.toString(),
                "Supplier accepted purchase order " + po.getPoNumber());

        return updated;
    }

    @Override
    @Transactional
    public PurchaseOrder rejectOrderBySupplier(Long id, String reason, String supplierEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        supplierService.verifySupplierAccess(supplierEmail, po.getSupplier().getId());

        if (po.getOrderStatus() != OrderStatus.APPROVED && po.getOrderStatus() != OrderStatus.SENT_TO_SUPPLIER && po.getOrderStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Order cannot be rejected from current status: " + po.getOrderStatus());
        }

        po.setOrderStatus(OrderStatus.SUPPLIER_REJECTED);
        String reasonStr = (reason != null && !reason.isBlank()) ? reason : "No specific rejection reason provided";
        po.setNotes(po.getNotes() != null ? po.getNotes() + " | Supplier Rejection Reason: " + reasonStr : "Supplier Rejection Reason: " + reasonStr);

        PurchaseOrder updated = purchaseOrderRepository.save(po);

        // Notify Admin and Pharmacist
        notificationService.notifyRole(
                Role.PHARMACIST,
                "Supplier Rejected PO: " + po.getPoNumber(),
                "Supplier " + po.getSupplier().getCompanyName() + " rejected purchase order " + po.getPoNumber() + ". Reason: " + reasonStr,
                NotificationType.PO_UPDATE
        );
        notificationService.notifyRole(
                Role.ADMIN,
                "Supplier Rejected PO: " + po.getPoNumber(),
                "Supplier " + po.getSupplier().getCompanyName() + " rejected purchase order " + po.getPoNumber() + ". Reason: " + reasonStr,
                NotificationType.PO_UPDATE
        );

        auditLogService.log(supplierEmail, Role.SUPPLIER.name(), "SUPPLIER_REJECT_PO", "PurchaseOrder", id.toString(),
                "Supplier rejected purchase order " + po.getPoNumber() + ". Reason: " + reasonStr);

        return updated;
    }

    @Override
    @Transactional
    public PurchaseOrder updateOrderStatusBySupplier(Long id, OrderStatusUpdateRequest request, String supplierEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        // Enforce strict supplier ownership check
        supplierService.verifySupplierAccess(supplierEmail, po.getSupplier().getId());

        OrderStatus targetStatus = request.getStatus();

        // Support full supplier workflow: ACCEPTED / SUPPLIER_ACCEPTED, REJECTED / SUPPLIER_REJECTED, ORDERED, SHIPPED, DELIVERED
        if (targetStatus == OrderStatus.SUPPLIER_ACCEPTED || targetStatus == OrderStatus.ACCEPTED || targetStatus == OrderStatus.ORDERED) {
            return acceptOrderBySupplier(id, request.getNotes(), supplierEmail);
        } else if (targetStatus == OrderStatus.SUPPLIER_REJECTED || targetStatus == OrderStatus.REJECTED) {
            return rejectOrderBySupplier(id, request.getNotes(), supplierEmail);
        } else if (targetStatus == OrderStatus.SHIPPED) {
            if (po.getOrderStatus() != OrderStatus.SUPPLIER_ACCEPTED && po.getOrderStatus() != OrderStatus.ACCEPTED &&
                po.getOrderStatus() != OrderStatus.ORDERED && po.getOrderStatus() != OrderStatus.APPROVED) {
                throw new BadRequestException("Order must be accepted/approved before it can be marked as SHIPPED. Current status: " + po.getOrderStatus());
            }
            po.setOrderStatus(OrderStatus.SHIPPED);
        } else if (targetStatus == OrderStatus.DELIVERED) {
            if (po.getOrderStatus() != OrderStatus.SHIPPED) {
                throw new BadRequestException("Order must be SHIPPED before confirming delivery. Current status: " + po.getOrderStatus());
            }
            po.setOrderStatus(OrderStatus.DELIVERED);
        } else {
            throw new BadRequestException("Suppliers can only change status to ACCEPTED, REJECTED, SHIPPED, or DELIVERED.");
        }

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            po.setNotes(po.getNotes() != null ? po.getNotes() + " | Supplier Note: " + request.getNotes() : request.getNotes());
        }

        PurchaseOrder updated = purchaseOrderRepository.save(po);

        notificationService.notifyRole(
                Role.PHARMACIST,
                "PO Status Update: " + po.getPoNumber(),
                "Supplier " + po.getSupplier().getCompanyName() + " updated purchase order " + po.getPoNumber() + " status to " + targetStatus.name(),
                NotificationType.PO_UPDATE
        );

        auditLogService.log(supplierEmail, Role.SUPPLIER.name(), "SUPPLIER_UPDATE_PO", "PurchaseOrder", id.toString(),
                "Supplier updated PO " + po.getPoNumber() + " status to " + targetStatus.name());

        return updated;
    }

    @Override
    @Transactional
    public PurchaseOrder receiveOrderStock(Long id, ReceiveStockRequest request, String userEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        boolean canReceive = po.getOrderStatus() == OrderStatus.SHIPPED ||
                             po.getOrderStatus() == OrderStatus.DELIVERED ||
                             po.getOrderStatus() == OrderStatus.PARTIALLY_RECEIVED ||
                             po.getOrderStatus() == OrderStatus.SUPPLIER_ACCEPTED ||
                             po.getOrderStatus() == OrderStatus.ACCEPTED ||
                             po.getOrderStatus() == OrderStatus.ORDERED;

        if (!canReceive) {
            throw new BadRequestException("Stock can only be received for orders that are SHIPPED, DELIVERED, ACCEPTED, or PARTIALLY_RECEIVED. Current status: " + po.getOrderStatus());
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);
        boolean allFullyReceived = true;
        int totalReceivedThisBatch = 0;

        for (ReceiveStockRequest.ReceiveItemDto receiveDto : request.getItems()) {
            PurchaseOrderItem item = po.getItems().stream()
                    .filter(i -> i.getId().equals(receiveDto.getItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Item with ID " + receiveDto.getItemId() + " not found in purchase order " + po.getPoNumber()));

            int newlyReceived = receiveDto.getReceivedQuantity();
            if (newlyReceived > 0) {
                item.setReceivedQuantity(item.getReceivedQuantity() + newlyReceived);
                totalReceivedThisBatch += newlyReceived;

                // Update medicine inventory quantity in database
                Medicine medicine = item.getMedicine();
                medicine.setQuantity(medicine.getQuantity() + newlyReceived);
                medicineRepository.save(medicine);

                // Log stock movement
                StockMovement movement = new StockMovement(
                        medicine,
                        MovementType.STOCK_IN,
                        newlyReceived,
                        "Stock received from Purchase Order " + po.getPoNumber(),
                        po.getPoNumber(),
                        user
                );
                stockMovementRepository.save(movement);
            }

            if (item.getReceivedQuantity() < item.getRequestedQuantity()) {
                allFullyReceived = false;
            }
        }

        if (allFullyReceived) {
            po.setOrderStatus(OrderStatus.COMPLETED);
            po.setPaymentStatus(PaymentStatus.PAID);
        } else {
            po.setOrderStatus(OrderStatus.PARTIALLY_RECEIVED);
            po.setPaymentStatus(PaymentStatus.PARTIAL);
        }

        po.setActualDeliveryDate(LocalDate.now());
        if (request.getNotes() != null) {
            po.setNotes(po.getNotes() != null ? po.getNotes() + " | Receipt Note: " + request.getNotes() : request.getNotes());
        }

        PurchaseOrder updated = purchaseOrderRepository.save(po);

        notificationService.notifyRole(
                Role.ADMIN,
                "Stock Received for PO: " + po.getPoNumber(),
                "Stock received (" + totalReceivedThisBatch + " units) for order " + po.getPoNumber() + ". Order status is now " + po.getOrderStatus().name(),
                NotificationType.PO_UPDATE
        );

        String userRole = user != null && user.getRole() != null ? user.getRole().name() : "STAFF";
        auditLogService.log(userEmail, userRole, "RECEIVE_STOCK", "PurchaseOrder", id.toString(),
                "Received stock for PO " + po.getPoNumber() + " (Total units received: " + totalReceivedThisBatch + ")");

        return updated;
    }

    @Override
    @Transactional
    public PurchaseOrder cancelOrder(Long id, String userEmail) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        if (po.getOrderStatus() == OrderStatus.COMPLETED || po.getOrderStatus() == OrderStatus.RECEIVED) {
            throw new BadRequestException("Completed or received orders cannot be cancelled.");
        }

        po.setOrderStatus(OrderStatus.CANCELLED);
        po.setPaymentStatus(PaymentStatus.CANCELLED);
        PurchaseOrder updated = purchaseOrderRepository.save(po);

        auditLogService.log(userEmail, "USER", "CANCEL_PO", "PurchaseOrder", id.toString(),
                "Cancelled purchase order " + po.getPoNumber());

        return updated;
    }
}
