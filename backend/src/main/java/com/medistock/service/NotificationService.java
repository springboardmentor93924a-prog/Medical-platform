
package com.medistock.service;

import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.Notification;
import com.medistock.entity.PurchaseOrder;

import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.NotificationRepository;
import com.medistock.repository.PurchaseOrderRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class NotificationService {

    public static final int EXPIRING_SOON_DAYS = 30;

    private final NotificationRepository notificationRepository;
    private final InventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            InventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            PurchaseOrderRepository purchaseOrderRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
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

            // Low-stock notification.
            if (item.getQuantity() != null
                    && item.getMinimumStock() != null
                    && item.getQuantity() <= item.getMinimumStock()) {

                created += createIfMissing(
                        null,
                        "LOW_STOCK",
                        "Low stock: " + name
                                + " (batch " + item.getBatchNumber()
                                + ") has " + item.getQuantity()
                                + " left, minimum " + item.getMinimumStock()
                );
            }

            // Expiry notifications.
            LocalDate expiry = item.getExpiryDate();

            if (expiry != null) {

                if (expiry.isBefore(today)) {

                    created += createIfMissing(
                            null,
                            "EXPIRED",
                            "Expired: " + name
                                    + " (batch " + item.getBatchNumber()
                                    + ") expired on " + expiry
                    );

                } else if (!expiry.isAfter(horizon)) {

                    created += createIfMissing(
                            null,
                            "EXPIRING_SOON",
                            "Expiring soon: " + name
                                    + " (batch " + item.getBatchNumber()
                                    + ") expires on " + expiry
                    );
                }
            }
        }

        // Pending purchase-order notifications.
        for (PurchaseOrder order : purchaseOrderRepository.findAll()) {

            if ("PENDING".equalsIgnoreCase(order.getStatus())) {

                created += createIfMissing(
                        null,
                        "ORDER_PENDING",
                        "Purchase order #" + order.getPurchaseOrderId()
                                + " (₹" + order.getTotalAmount()
                                + ") is awaiting approval"
                );
            }
        }

        return created;
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

            createIfMissing(
                    null,
                    "LOW_STOCK",
                    "Low stock: " + name
                            + " (batch " + item.getBatchNumber()
                            + ") has " + item.getQuantity()
                            + " left, minimum " + item.getMinimumStock()
            );
        }
    }

    // Get latest 50 shared and personal notifications.
    @Transactional(readOnly = true)
    public List<Notification> getRecent(Long userId) {

        return notificationRepository.findRecentVisibleToUser(
                userId,
                PageRequest.of(0, 50)
        );
    }

    // Get all shared and personal notifications.
    @Transactional(readOnly = true)
    public List<Notification> getAll(Long userId) {

        return notificationRepository.findVisibleToUser(userId);
    }

    // Get unread shared and personal notifications.
    @Transactional(readOnly = true)
    public List<Notification> getUnread(Long userId) {

        return notificationRepository.findUnreadVisibleToUser(userId);
    }

    // Get read shared and personal notifications.
    @Transactional(readOnly = true)
    public List<Notification> getRead(Long userId) {

        return notificationRepository.findReadVisibleToUser(userId);
    }

    // Count unread notifications visible to a user.
    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {

        return notificationRepository.countUnreadVisibleToUser(userId);
    }

    // Mark one shared or personal notification as read.
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

    // Mark all visible notifications as read.
    public int markAllRead(Long userId) {

        List<Notification> unread =
                notificationRepository.findUnreadVisibleToUser(userId);

        unread.forEach(notification ->
                notification.setRead(true)
        );

        notificationRepository.saveAll(unread);

        return unread.size();
    }

    // Delete one shared or personal notification.
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

    // Delete all notifications visible to this user.
    // Shared notifications are deleted globally.
    public void clearAll(Long userId) {

        List<Notification> notifications =
                notificationRepository.findVisibleToUser(userId);

        notificationRepository.deleteAll(notifications);
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

    // Get medicine name.
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
