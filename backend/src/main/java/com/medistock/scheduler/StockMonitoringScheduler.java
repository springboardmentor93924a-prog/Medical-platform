package com.medistock.scheduler;

import com.medistock.entity.Medicine;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.service.MedicineService;
import com.medistock.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class StockMonitoringScheduler {

    private static final Logger logger = LoggerFactory.getLogger(StockMonitoringScheduler.class);
    private final MedicineService medicineService;
    private final NotificationService notificationService;

    public StockMonitoringScheduler(MedicineService medicineService, NotificationService notificationService) {
        this.medicineService = medicineService;
        this.notificationService = notificationService;
    }

    /**
     * Scheduled task to monitor stock levels for low-stock and out-of-stock items.
     * Uses valid NotificationType.LOW_STOCK and NotificationType.OUT_OF_STOCK.
     * Persists real notifications for all active Pharmacist users.
     */
    @Scheduled(cron = "${app.scheduler.stock-cron:0 0 2 * * ?}")
    public void monitorStockLevels() {
        logger.info("Executing scheduled stock level monitoring audit...");
        try {
            List<Medicine> outOfStockList = medicineService.getOutOfStockMedicines();
            for (Medicine med : outOfStockList) {
                notificationService.notifyRole(
                        Role.PHARMACIST,
                        "Out of Stock Alert: " + med.getName(),
                        "Medicine '" + med.getName() + "' (Batch: " + med.getBatchNumber() + ") is completely OUT OF STOCK (0 units remaining).",
                        NotificationType.OUT_OF_STOCK
                );
            }

            List<Medicine> lowStockList = medicineService.getLowStockMedicines();
            for (Medicine med : lowStockList) {
                notificationService.notifyRole(
                        Role.PHARMACIST,
                        "Low Stock Alert: " + med.getName(),
                        "Medicine '" + med.getName() + "' stock is low: " + med.getQuantity() + " remaining (Minimum threshold: " + med.getMinimumStockLevel() + ").",
                        NotificationType.LOW_STOCK
                );
            }
            logger.info("Stock level monitoring completed. Processed {} out of stock, {} low stock items.", outOfStockList.size(), lowStockList.size());
        } catch (Exception e) {
            logger.error("Error during scheduled stock monitoring: {}", e.getMessage(), e);
        }
    }
}
