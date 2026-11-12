package com.medistock.medistock_backend.service;

import com.medistock.medistock_backend.entity.Medicine;
import com.medistock.medistock_backend.entity.User;
import com.medistock.medistock_backend.repository.MedicineRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationScheduler {

    private final MedicineRepository medicineRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;

    // ==========================================
    // LOW STOCK DIGEST — runs daily at 9:00 AM
    // ==========================================
    @Scheduled(cron = "0 0 9 * * *")
    public void scheduleLowStockDigest() {
        System.out.println("⏰ Running scheduled low-stock digest...");
        sendLowStockDigestNow();
    }

    public int sendLowStockDigestNow() {
        List<Medicine> lowStock = medicineRepo.findAll().stream()
                .filter(m -> m.getQuantity() != null && m.getMinQuantity() != null)
                .filter(m -> m.getQuantity() <= m.getMinQuantity())
                .collect(Collectors.toList());

        if (lowStock.isEmpty()) {
            System.out.println("✅ No low-stock items found — skipping digest");
            return 0;
        }

        List<EmailService.LowStockItem> items = lowStock.stream()
                .map(m -> new EmailService.LowStockItem(
                        m.getName(),
                        m.getBatchNumber(),
                        m.getQuantity(),
                        m.getMinQuantity(),
                        m.getSupplier() != null ? m.getSupplier().getName() : "Unassigned"
                ))
                .collect(Collectors.toList());

        List<String> recipients = new ArrayList<>();
        for (User u : userRepo.findAll()) {
            if (u.getRoles() != null && u.isEnabled() && u.getEmail() != null) {
                boolean isAdminOrPharmacist = u.getRoles().stream()
                        .anyMatch(r -> {
                            if (r == null || r.getName() == null) return false;
                            String normalized = r.getName().toUpperCase().replace("ROLE_", "");
                            return normalized.equals("ADMIN") || normalized.equals("PHARMACIST");
                        });
                if (isAdminOrPharmacist) {
                    recipients.add(u.getEmail());
                }
            }
        }

        if (recipients.isEmpty()) {
            System.out.println("⚠️ No admin/pharmacist recipients found for low-stock digest");
            return 0;
        }

        emailService.sendLowStockDigest(recipients, items);
        System.out.println("📧 Low-stock digest sent to " + recipients.size() + " recipients (" + items.size() + " items)");
        return items.size();
    }

    // ==========================================
    // EXPIRY WARNING DIGEST — runs daily at 9:05 AM
    // ==========================================
    @Scheduled(cron = "0 0 9 * * *")
    public void scheduleExpiryWarningDigest() {
        System.out.println("⏰ Running scheduled expiry-warning digest...");
        sendExpiryWarningDigestNow();
    }

    public int sendExpiryWarningDigestNow() {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(45);

        List<Medicine> expiring = medicineRepo.findAll().stream()
                .filter(m -> m.getExpiryDate() != null)
                .filter(m -> m.getExpiryDate().isBefore(cutoff))
                .filter(m -> m.getQuantity() != null && m.getQuantity() > 0)
                .collect(Collectors.toList());

        if (expiring.isEmpty()) {
            System.out.println("✅ No expiring items found — skipping digest");
            return 0;
        }

        List<EmailService.ExpiringItem> items = expiring.stream()
                .map(m -> new EmailService.ExpiringItem(
                        m.getName(),
                        m.getBatchNumber(),
                        m.getExpiryDate() != null ? m.getExpiryDate().toString() : "N/A",
                        m.getQuantity(),
                        m.getExpiryDate() != null ? ChronoUnit.DAYS.between(today, m.getExpiryDate()) : 0
                ))
                .collect(Collectors.toList());

        List<String> recipients = new ArrayList<>();
        for (User u : userRepo.findAll()) {
            if (u.getRoles() != null && u.isEnabled() && u.getEmail() != null) {
                boolean isAdminOrPharmacist = u.getRoles().stream()
                        .anyMatch(r -> {
                            if (r == null || r.getName() == null) return false;
                            String normalized = r.getName().toUpperCase().replace("ROLE_", "");
                            return normalized.equals("ADMIN") || normalized.equals("PHARMACIST");
                        });
                if (isAdminOrPharmacist) {
                    recipients.add(u.getEmail());
                }
            }
        }

        if (recipients.isEmpty()) {
            System.out.println("⚠️ No admin/pharmacist recipients found for expiry digest");
            return 0;
        }

        emailService.sendExpiryWarningDigest(recipients, items);
        System.out.println("📧 Expiry digest sent to " + recipients.size() + " recipients (" + items.size() + " items)");
        return items.size();
    }
}