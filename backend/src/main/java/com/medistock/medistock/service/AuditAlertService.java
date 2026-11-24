package com.medistock.medistock.service;

import com.medistock.medistock.entity.AuditAlert;
import com.medistock.medistock.repository.AuditAlertRepository;
import com.medistock.medistock.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditAlertService {

    private final AuditAlertRepository auditAlertRepository;
    private final AuditLogRepository auditLogRepository;

    public AuditAlertService(AuditAlertRepository auditAlertRepository, AuditLogRepository auditLogRepository) {
        this.auditAlertRepository = auditAlertRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditAlert> getRecentAlerts() {
        return auditAlertRepository.findTop50ByOrderByCreatedAtDesc();
    }

    public Page<AuditAlert> getAlertsByStatus(String status, Pageable pageable) {
        return auditAlertRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    public long getActiveAlertsCount() {
        return auditAlertRepository.countByStatus("ACTIVE");
    }

    public AuditAlert acknowledgeAlert(Integer alertId, String adminEmail) {
        AuditAlert alert = auditAlertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Audit alert not found with ID: " + alertId));
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedBy(adminEmail);
        alert.setAcknowledgedAt(LocalDateTime.now());
        return auditAlertRepository.save(alert);
    }

    /**
     * Anomaly Detector: Check for repeated failed logins (Brute Force trigger >= 3 failures in 10 mins).
     */
    public void checkForBruteForceLogin(String email, String ipAddress) {
        try {
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            long failuresByEmail = auditLogRepository.countRecentFailedLoginsByEmail(email, tenMinutesAgo);
            long failuresByIp = auditLogRepository.countRecentFailedLoginsByIp(ipAddress, tenMinutesAgo);

            if (failuresByEmail >= 3 || failuresByIp >= 5) {
                String desc = String.format("Detected %d failed login attempts for account '%s' originating from IP %s within 10 minutes.",
                        Math.max(failuresByEmail, failuresByIp), email, ipAddress);

                AuditAlert alert = new AuditAlert(
                        "BRUTE_FORCE_ATTEMPT",
                        "CRITICAL",
                        null,
                        email,
                        "UNKNOWN",
                        "Repeated Failed Login Attempts Detected",
                        desc,
                        String.format("{\"email\":\"%s\",\"ip\":\"%s\",\"recentFailures\":%d}", email, ipAddress, Math.max(failuresByEmail, failuresByIp))
                );
                auditAlertRepository.save(alert);
            }
        } catch (Exception e) {
            System.err.println("Failed to evaluate brute force alert: " + e.getMessage());
        }
    }

    /**
     * Anomaly Detector: Unauthorized Access / Privilege Escalation Attempt (403 Forbidden).
     */
    public void recordUnauthorizedAccessAlert(Integer userId, String userEmail, String roleName, String targetEndpoint, String ipAddress) {
        try {
            String desc = String.format("User %s (%s) attempted unauthorized access to restricted endpoint: %s from IP %s.",
                    userEmail != null ? userEmail : "Anonymous", roleName, targetEndpoint, ipAddress);

            AuditAlert alert = new AuditAlert(
                    "UNAUTHORIZED_ACCESS_ATTEMPT",
                    "HIGH",
                    userId,
                    userEmail,
                    roleName,
                    "Unauthorized Endpoint Access Attempt Blocked",
                    desc,
                    String.format("{\"endpoint\":\"%s\",\"ip\":\"%s\"}", targetEndpoint, ipAddress)
            );
            auditAlertRepository.save(alert);
        } catch (Exception e) {
            System.err.println("Failed to save unauthorized access alert: " + e.getMessage());
        }
    }

    /**
     * Anomaly Detector: Bulk Inventory Deviation or High Loss Write-Off.
     */
    public void recordBulkStockChangeAlert(Integer userId, String userEmail, String roleName, String medicineName, int quantity, double value) {
        try {
            if (quantity >= 100 || value >= 1000.0) {
                String desc = String.format("Unusual high-volume stock change of %d units for '%s' ($%.2f) logged by %s (%s).",
                        quantity, medicineName, value, userEmail, roleName);

                AuditAlert alert = new AuditAlert(
                        "BULK_STOCK_DEVIATION",
                        "MEDIUM",
                        userId,
                        userEmail,
                        roleName,
                        "High Volume Stock Adjustment Anomaly",
                        desc,
                        String.format("{\"medicine\":\"%s\",\"quantity\":%d,\"lossValue\":%.2f}", medicineName, quantity, value)
                );
                auditAlertRepository.save(alert);
            }
        } catch (Exception e) {
            System.err.println("Failed to save bulk stock alert: " + e.getMessage());
        }
    }
}
