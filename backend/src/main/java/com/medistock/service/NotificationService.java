package com.medistock.service;

import com.medistock.entity.Inventory;
import com.medistock.entity.Medicine;
import com.medistock.entity.Notification;
import com.medistock.entity.PurchaseOrder;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.NotificationRepository;
import com.medistock.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
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
            PurchaseOrderRepository purchaseOrderRepository) {
        this.notificationRepository = notificationRepository;
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    /**
     * Scans inventory and purchase orders and creates unread
     * notifications for low stock, expiry and pending orders.
     * Duplicate unread notifications of the same type+message are skipped.
     *
     * @return number of new notifications created
     */
    public int refresh() {
        int created = 0;
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(EXPIRING_SOON_DAYS);

        List<Medicine> medicines = medicineRepository.findAll();

        for (Inventory item : inventoryRepository.findAll()) {
            String name = medicineName(item.getMedicineId(), medicines);

            if (item.getQuantity() <= item.getMinimumStock()) {
                created += createIfMissing("LOW_STOCK",
                        "Low stock: " + name + " (batch " + item.getBatchNumber()
                                + ") has " + item.getQuantity()
                                + " left, minimum " + item.getMinimumStock());
            }

            LocalDate expiry = item.getExpiryDate();
            if (expiry != null && expiry.isBefore(today)) {
                created += createIfMissing("EXPIRED",
                        "Expired: " + name + " (batch " + item.getBatchNumber()
                                + ") expired on " + expiry);
            } else if (expiry != null && !expiry.isAfter(horizon)) {
                created += createIfMissing("EXPIRING_SOON",
                        "Expiring soon: " + name + " (batch " + item.getBatchNumber()
                                + ") expires on " + expiry);
            }
        }

        for (PurchaseOrder order : purchaseOrderRepository.findAll()) {
            if ("PENDING".equalsIgnoreCase(order.getStatus())) {
                created += createIfMissing("ORDER_PENDING",
                        "Purchase order #" + order.getPurchaseOrderId()
                                + " (₹" + order.getTotalAmount()
                                + ") is awaiting approval");
            }
        }

        return created;
    }

    /** Called right after a stock movement that may have dropped a batch to its minimum. */
    public void notifyLowStock(Inventory item) {
        if (item.getQuantity() <= item.getMinimumStock()) {
            String name = medicineRepository.findById(item.getMedicineId())
                    .map(Medicine::getMedicineName)
                    .orElse("Medicine #" + item.getMedicineId());

            createIfMissing("LOW_STOCK",
                    "Low stock: " + name + " (batch " + item.getBatchNumber()
                            + ") has " + item.getQuantity()
                            + " left, minimum " + item.getMinimumStock());
        }
    }

    public List<Notification> getRecent() {
        return notificationRepository.findTop50ByOrderByNotificationIdDesc();
    }

    public long unreadCount() {
        return notificationRepository.countByReadFalse();
    }

    public void markRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public int markAllRead() {
        List<Notification> unread = notificationRepository.findUnread();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    private int createIfMissing(String type, String message) {
        if (notificationRepository
                .existsByNotificationTypeAndMessageAndReadFalse(type, message)) {
            return 0;
        }

        Notification notification = new Notification();
        notification.setNotificationType(type);
        notification.setMessage(message);
        notification.setRead(false);
        notificationRepository.save(notification);
        return 1;
    }

    private String medicineName(Long medicineId, List<Medicine> medicines) {
        return medicines.stream()
                .filter(m -> m.getMedicineId().equals(medicineId))
                .map(Medicine::getMedicineName)
                .findFirst()
                .orElse("Medicine #" + medicineId);
    }
}
