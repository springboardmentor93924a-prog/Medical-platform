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
public class ExpiryMonitoringScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ExpiryMonitoringScheduler.class);
    private final MedicineService medicineService;
    private final NotificationService notificationService;

    public ExpiryMonitoringScheduler(MedicineService medicineService, NotificationService notificationService) {
        this.medicineService = medicineService;
        this.notificationService = notificationService;
    }

    /**
     * Scheduled task to monitor medicines for near-expiry and expired states.
     * Uses valid NotificationType.EXPIRED and NotificationType.EXPIRING_SOON.
     * Persists real notifications for all active Pharmacist users.
     */
    @Scheduled(cron = "${app.scheduler.expiry-cron:0 0 1 * * ?}")
    public void monitorMedicineExpiry() {
        logger.info("Executing scheduled medicine expiry monitoring audit...");
        try {
            List<Medicine> expiredList = medicineService.getExpiredMedicines();
            for (Medicine med : expiredList) {
                notificationService.notifyRole(
                        Role.PHARMACIST,
                        "Expired Medicine Alert: " + med.getName(),
                        "Batch " + med.getBatchNumber() + " of medicine '" + med.getName() + "' expired on " + med.getExpiryDate() + ". Do not issue or sell.",
                        NotificationType.EXPIRED
                );
            }

            List<Medicine> nearExpiryList = medicineService.getNearExpiryMedicines();
            for (Medicine med : nearExpiryList) {
                notificationService.notifyRole(
                        Role.PHARMACIST,
                        "Near Expiry Warning: " + med.getName(),
                        "Medicine '" + med.getName() + "' (Batch: " + med.getBatchNumber() + ") will expire on " + med.getExpiryDate() + ".",
                        NotificationType.EXPIRING_SOON
                );
            }
            logger.info("Expiry monitoring completed. Processed {} expired, {} near expiry items.", expiredList.size(), nearExpiryList.size());
        } catch (Exception e) {
            logger.error("Error during scheduled expiry monitoring: {}", e.getMessage(), e);
        }
    }
}
