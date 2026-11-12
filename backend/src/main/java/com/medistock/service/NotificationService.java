
package com.medistock.service;

import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.Notification;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;

import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.NotificationRepository;
import com.medistock.repository.PurchaseOrderRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class NotificationService {

    private static final Logger logger =
            LoggerFactory.getLogger(NotificationService.class);

    public static final int EXPIRING_SOON_DAYS = 30;

    private final NotificationRepository notificationRepository;
    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public NotificationService(
            NotificationRepository notificationRepository,
            InventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.notificationRepository = notificationRepository;
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // Generate low-stock, expiry and pending-order notifications.
    public int refresh() {

        int created = 0;

        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(EXPIRING_SOON_DAYS);

        List<Medicine> medicines = medicineRepository.findAll();

        for (Inventory item : inventoryRepository.findAll()) {

            String name = medicineName(
                    item.getMedicineId(),
                    medicines
            );

            if (item.getQuantity() != null
                    && item.getMinimumStock() != null
                    && item.getQuantity() <= item.getMinimumStock()) {

                String message = "Low stock: " + name
                        + " (batch " + item.getBatchNumber()
                        + ") has " + item.getQuantity()
                        + " left, minimum " + item.getMinimumStock();

                created += createSharedAlert(
                        "LOW_STOCK",
                        "MediStock - Low Stock Alert",
                        message
                );
            }

            LocalDate expiry = item.getExpiryDate();

            if (expiry != null) {

                if (expiry.isBefore(today)) {

                    String message = "Expired: " + name
                            + " (batch " + item.getBatchNumber()
                            + ") expired on " + expiry;

                    created += createSharedAlert(
                            "EXPIRED",
                            "MediStock - Expired Medicine Alert",
                            message
                    );

                } else if (!expiry.isAfter(horizon)) {

                    String message = "Expiring soon: " + name
                            + " (batch " + item.getBatchNumber()
                            + ") expires on " + expiry;

                    created += createSharedAlert(
                            "EXPIRING_SOON",
                            "MediStock - Expiry Alert",
                            message
                    );
                }
            }
        }

        // Pending purchase-order notifications.
        for (PurchaseOrder order : purchaseOrderRepository.findAll()) {

            if ("PENDING".equalsIgnoreCase(order.getStatus())) {

                String message = "Purchase order #"
                        + order.getPurchaseOrderId()
                        + " (₹" + order.getTotalAmount()
                        + ") is awaiting approval";

                created += createSharedAlert(
                        "ORDER_PENDING",
                        "MediStock - Pending Purchase Order",
                        message
                );
            }
        }

        return created;
    }

    // Create shared in-app notification and email active Admin/Pharmacist users.
    private int createSharedAlert(
            String type,
            String subject,
            String message
    ) {

        int created = createIfMissing(null, type, message);

        if (created > 0) {
            sendRoleEmails("ADMIN", subject, message);
            sendRoleEmails("PHARMACIST", subject, message);
        }

        return created;
    }

    // Send email to active users with the specified role.
    private void sendRoleEmails(
            String roleName,
            String subject,
            String message
    ) {

        List<User> users =
                userRepository.findByRoleRoleNameIgnoreCaseAndActiveTrue(
                        roleName
                );

        for (User user : users) {

            if (user.getEmail() == null || user.getEmail().isBlank()) {
                continue;
            }

            try {
                emailService.sendTextEmail(
                        user.getEmail(),
                        subject,
                        buildEmailBody(user.getFullName(), message)
                );

            } catch (Exception exception) {
                logger.warn(
                        "Could not send {} notification email to {}: {}",
                        roleName,
                        user.getEmail(),
                        exception.getMessage()
                );
            }
        }
    }

    private String buildEmailBody(String name, String message) {

        return "Hello " + (name == null ? "User" : name) + ",\n\n"
                + "You have received a new notification from MediStock.\n\n"
                + message + "\n\n"
                + "Please log in to MediStock to view more details.\n\n"
                + "Regards,\nMediStock Team";
    }

    // Called after stock IN or OUT.
    public void notifyLowStock(Inventory item) {

        if (item.getQuantity() == null
                || item.getMinimumStock() == null) {
            return;
        }

        if (item.getQuantity() <= item.getMinimumStock()) {

            String name = medicineRepository
                    .findById(item.getMedicineId())
                    .map(Medicine::getMedicineName)
                    .orElse("Medicine #" + item.getMedicineId());

            String message = "Low stock: " + name
                    + " (batch " + item.getBatchNumber()
                    + ") has " + item.getQuantity()
                    + " left, minimum " + item.getMinimumStock();

            createSharedAlert(
                    "LOW_STOCK",
                    "MediStock - Low Stock Alert",
                    message
            );
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> getRecent(Long userId) {
        return notificationRepository.findRecentVisibleToUser(
                userId,
                PageRequest.of(0, 50)
        );
    }

    @Transactional(readOnly = true)
    public List<Notification> getAll(Long userId) {
        return notificationRepository.findVisibleToUser(userId);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findUnreadVisibleToUser(userId);
    }

    @Transactional(readOnly = true)
    public List<Notification> getRead(Long userId) {
        return notificationRepository.findReadVisibleToUser(userId);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countUnreadVisibleToUser(userId);
    }

    public boolean markRead(Long id, Long userId) {

        return notificationRepository.findById(id)
                .filter(notification ->
                        notification.getUserId() == null
                                || notification.getUserId().equals(userId)
                )
                .map(notification -> {
                    notification.setRead(true);
                    return true;
                })
                .orElse(false);
    }

    public int markAllRead(Long userId) {

        List<Notification> unread =
                notificationRepository.findUnreadVisibleToUser(userId);

        unread.forEach(notification ->
                notification.setRead(true)
        );

        notificationRepository.saveAll(unread);

        return unread.size();
    }

    public boolean deleteNotification(Long id, Long userId) {

        return notificationRepository.findById(id)
                .filter(notification ->
                        notification.getUserId() == null
                                || notification.getUserId().equals(userId)
                )
                .map(notification -> {
                    notificationRepository.delete(notification);
                    return true;
                })
                .orElse(false);
    }

    public void clearAll(Long userId) {

        List<Notification> notifications =
                notificationRepository.findVisibleToUser(userId);

        notificationRepository.deleteAll(notifications);
    }

    // Notify supplier when their purchase-order status changes.
   
// Notify supplier when a purchase-order event occurs.
public void notifySupplierOrderStatus(PurchaseOrder order) {

    if (order == null
            || order.getSupplierId() == null
            || order.getStatus() == null) {
        return;
    }

    Supplier supplier = supplierRepository
            .findById(order.getSupplierId())
            .orElse(null);

    if (supplier == null
            || supplier.getEmail() == null
            || supplier.getEmail().isBlank()) {
        logger.warn("Supplier email not found for PO #{}",
                order.getPurchaseOrderId());
        return;
    }

    String supplierEmail = supplier.getEmail().trim();

    User user = userRepository
            .findByEmail(supplierEmail.toLowerCase())
            .orElse(null);

    String status = order.getStatus().trim().toUpperCase();

    String type;
    String subject;
    String message;

    switch (status) {

        case "PENDING":
            type = "PURCHASE_ORDER_PLACED";
            subject = "MediStock - New Purchase Order";
            message = "A new purchase order #"
                    + order.getPurchaseOrderId()
                    + " has been placed for your supply."
                    + "\nOrder amount: ₹" + order.getTotalAmount()
                    + "\nStatus: Pending approval.";
            break;

        case "APPROVED":
            type = "PURCHASE_ORDER_APPROVED";
            subject = "MediStock - Purchase Order Approved";
            message = "Your purchase order #"
                    + order.getPurchaseOrderId()
                    + " has been approved by the admin."
                    + "\nOrder amount: ₹" + order.getTotalAmount();
            break;

        case "REJECTED":
            type = "PURCHASE_ORDER_REJECTED";
            subject = "MediStock - Purchase Order Rejected";
            message = "Your purchase order #"
                    + order.getPurchaseOrderId()
                    + " has been rejected by the admin.";
            break;

        case "RECEIVED":
            type = "PURCHASE_ORDER_RECEIVED";
            subject = "MediStock - Purchase Order Received";
            message = "Your purchase order #"
                    + order.getPurchaseOrderId()
                    + " has been successfully received by MediStock.";
            break;

        case "PARTIALLY_RECEIVED":
            type = "PURCHASE_ORDER_PARTIALLY_RECEIVED";
            subject = "MediStock - Partial Order Received";
            message = "A partial quantity from your purchase order #"
                    + order.getPurchaseOrderId()
                    + " has been received by MediStock.";
            break;

        case "CANCELLED":
            type = "PURCHASE_ORDER_CANCELLED";
            subject = "MediStock - Purchase Order Cancelled";
            message = "Your purchase order #"
                    + order.getPurchaseOrderId()
                    + " has been cancelled.";
            break;

        default:
            logger.warn("No supplier email template configured for status {}",
                    status);
            return;
    }

    // Create an in-app notification for the supplier account.
    int created = 0;

    if (user != null && user.getUserId() != null) {
        created = createIfMissing(
                user.getUserId(),
                type,
                message
        );
    }

    // Send the email even if the supplier has no matching User record.
    // If an in-app notification already exists, avoid resending the email.
    if (user != null && created == 0) {
        return;
    }

    try {
        emailService.sendTextEmail(
                supplierEmail,
                subject,
                buildEmailBody(supplier.getSupplierName(), message)
        );

        logger.info(
                "Purchase-order {} email sent to {}",
                status,
                supplierEmail
        );

    } catch (Exception exception) {
        logger.error(
                "Could not send purchase-order email to {}",
                supplierEmail,
                exception
        );
    }
}


    // Create notification if an unread duplicate does not exist.
    private int createIfMissing(
            Long userId,
            String type,
            String message
    ) {

        boolean exists =
                notificationRepository
                        .existsByUserIdAndNotificationTypeAndMessageAndReadFalse(
                                userId,
                                type,
                                message
                        );

        if (exists) {
            return 0;
        }

        Notification notification = new Notification(
                userId,
                type,
                message
        );

        notificationRepository.save(notification);

        return 1;
    }

    private String medicineName(
            Long medicineId,
            List<Medicine> medicines
    ) {

        return medicines.stream()
                .filter(medicine ->
                        medicine.getMedicineId().equals(medicineId)
                )
                .map(Medicine::getMedicineName)
                .findFirst()
                .orElse("Medicine #" + medicineId);
    }
}
