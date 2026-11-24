package com.medistock.medistock.service;

import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.Task;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.event.MediStockEmailEvent;
import com.medistock.medistock.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;

    public EmailNotificationService(ApplicationEventPublisher eventPublisher,
                                    UserRepository userRepository) {
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
    }

    /**
     * Core method to publish a MediStockEmailEvent.
     */
    public void sendEmail(String eventType,
                          Integer recipientUserId,
                          String recipientEmail,
                          String recipientName,
                          String subject,
                          String templateName,
                          Map<String, Object> templateData,
                          String priority,
                          String idempotencyKey,
                          boolean mandatory) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            if (recipientUserId != null) {
                recipientEmail = userRepository.findById(recipientUserId).map(User::getEmail).orElse(null);
            }
        }

        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("[EmailNotificationService] Skipped sending '{}': recipient email could not be resolved", eventType);
            return;
        }

        if (recipientName == null || recipientName.isBlank()) {
            if (recipientUserId != null) {
                recipientName = userRepository.findById(recipientUserId).map(User::getFullName).orElse("Valued User");
            }
        }

        MediStockEmailEvent event = new MediStockEmailEvent(
                idempotencyKey,
                eventType,
                recipientUserId,
                recipientEmail,
                recipientName,
                subject,
                templateName,
                templateData != null ? templateData : new HashMap<>(),
                priority,
                mandatory
        );

        eventPublisher.publishEvent(event);
    }

    /**
     * Sends Purchase Order notifications for Admin, Pharmacist, or Supplier.
     */
    public void notifyPurchaseOrderEvent(PurchaseOrder po, String eventType, String subject, Integer recipientUserId, String notes) {
        if (po == null) return;

        User recipient = recipientUserId != null ? userRepository.findById(recipientUserId).orElse(null) : null;
        String email = recipient != null ? recipient.getEmail() : null;
        String name = recipient != null ? recipient.getFullName() : "Valued Partner";

        // Fallback for Supplier if recipient user is not set
        if (email == null && po.getSupplier() != null && po.getSupplier().getEmail() != null) {
            email = po.getSupplier().getEmail();
            name = po.getSupplier().getSupplierName();
        }

        if (email == null) {
            log.warn("[EmailNotificationService] Cannot send PO event '{}': recipient email missing", eventType);
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("poNumber", "PO-" + po.getPurchaseOrderId());
        data.put("orderId", po.getPurchaseOrderId());
        data.put("status", po.getStatus());
        data.put("totalAmount", String.format(Locale.US, "%.2f", po.getTotalAmount() != null ? po.getTotalAmount() : 0.0));
        data.put("supplierName", po.getSupplier() != null ? po.getSupplier().getSupplierName() : "Designated Supplier");
        data.put("notes", notes != null ? notes : "Status updated to " + po.getStatus());
        data.put("requestedBy", po.getCreatedBy() != null ? "User #" + po.getCreatedBy() : "Pharmacy Department");

        String template = eventType.toUpperCase().contains("SUPPLIER") ? "SUPPLIER_DELIVERY" : "PURCHASE_ORDER";
        String idempotencyKey = "PO-" + po.getPurchaseOrderId() + "-" + eventType + "-" + (recipientUserId != null ? recipientUserId : email.hashCode());

        sendEmail(
                eventType,
                recipientUserId,
                email,
                name,
                subject,
                template,
                data,
                "HIGH",
                idempotencyKey,
                false
        );
    }

    /**
     * Sends Low Stock inventory alert to Admin & Pharmacists.
     */
    public void notifyLowStock(String medicineName, String batchNumber, int currentStock, int threshold, String category) {
        Map<String, Object> data = new HashMap<>();
        data.put("medicineName", medicineName);
        data.put("batchNumber", batchNumber != null ? batchNumber : "N/A");
        data.put("currentStock", currentStock);
        data.put("threshold", threshold);
        data.put("category", category != null ? category : "General");
        data.put("severity", currentStock <= 5 ? "CRITICAL OUT-OF-STOCK RISK" : "LOW STOCK WARNING");

        String subject = "INVENTORY ALERT: " + medicineName + " Low Stock (" + currentStock + " units left)";

        // Notify all Admins (role 1) and Pharmacists (role 2)
        List<User> recipients = new ArrayList<>();
        recipients.addAll(userRepository.findByRoleId(1));
        recipients.addAll(userRepository.findByRoleId(2));

        for (User u : recipients) {
            String idempotencyKey = "LOWSTOCK-" + medicineName.replaceAll("\\s+", "_") + "-" + u.getUserId() + "-" + LocalDate.now();
            sendEmail(
                    "CRITICAL_LOW_STOCK",
                    u.getUserId(),
                    u.getEmail(),
                    u.getFullName(),
                    subject,
                    "INVENTORY_ALERT",
                    data,
                    currentStock <= 5 ? "CRITICAL" : "HIGH",
                    idempotencyKey,
                    false
            );
        }
    }

    /**
     * Sends FEFO Expiry alert.
     */
    public void notifyExpiryFefo(String medicineName, String batchNumber, LocalDate expiryDate, long daysRemaining, String actionAdvice) {
        Map<String, Object> data = new HashMap<>();
        data.put("medicineName", medicineName);
        data.put("batchNumber", batchNumber);
        data.put("expiryDate", expiryDate != null ? expiryDate.format(DateTimeFormatter.ISO_LOCAL_DATE) : "N/A");
        data.put("daysRemaining", daysRemaining);
        data.put("actionAdvice", actionAdvice);
        data.put("alertType", daysRemaining < 0 ? "EXPIRED STOCK" : (daysRemaining <= 15 ? "CRITICAL EXPIRY" : "NEAR EXPIRY"));

        String subject = (daysRemaining < 0 ? "EXPIRED BATCH: " : "FEFO ALERT: ") + medicineName + " (Batch " + batchNumber + ")";

        List<User> recipients = new ArrayList<>();
        recipients.addAll(userRepository.findByRoleId(1));
        recipients.addAll(userRepository.findByRoleId(2));

        for (User u : recipients) {
            String idempotencyKey = "EXPIRY-" + batchNumber + "-" + u.getUserId() + "-" + LocalDate.now();
            sendEmail(
                    daysRemaining < 0 ? "MEDICINE_EXPIRED" : "MEDICINE_NEAR_EXPIRY",
                    u.getUserId(),
                    u.getEmail(),
                    u.getFullName(),
                    subject,
                    "EXPIRY_FEFO",
                    data,
                    daysRemaining <= 0 ? "CRITICAL" : "HIGH",
                    idempotencyKey,
                    false
            );
        }
    }

    /**
     * Sends Task Assignment alert to staff.
     */
    public void notifyTaskAssigned(Task task, User assignedTo, User assignedBy) {
        if (task == null || assignedTo == null) return;

        Map<String, Object> data = new HashMap<>();
        data.put("taskId", task.getTaskId());
        data.put("title", task.getTitle());
        data.put("priority", task.getPriority() != null ? task.getPriority() : "NORMAL");
        data.put("dueDate", task.getDueDate() != null ? task.getDueDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")) : "Pending assignment");
        data.put("assignedBy", assignedBy != null ? assignedBy.getFullName() : "Supervisor");
        data.put("description", task.getDescription() != null ? task.getDescription() : "Complete assigned operational check.");

        String subject = "New Inventory Task Assigned: " + task.getTitle();
        String idempotencyKey = "TASK-" + task.getTaskId() + "-" + assignedTo.getUserId();

        sendEmail(
                "TASK_ASSIGNED",
                assignedTo.getUserId(),
                assignedTo.getEmail(),
                assignedTo.getFullName(),
                subject,
                "TASK_ASSIGNMENT",
                data,
                task.getPriority(),
                idempotencyKey,
                false
        );
    }

    /**
     * Sends Feedback ticket status / message update.
     */
    public void notifyFeedbackUpdate(String ticketNumber, String title, String status, String messagePreview, Integer recipientUserId, String recipientEmail, String recipientName) {
        Map<String, Object> data = new HashMap<>();
        data.put("ticketNumber", ticketNumber);
        data.put("ticketTitle", title);
        data.put("status", status);
        data.put("message", messagePreview);

        String subject = "Feedback Ticket " + ticketNumber + " Update: " + status;
        String idempotencyKey = "FB-" + ticketNumber + "-" + System.currentTimeMillis();

        sendEmail(
                "FEEDBACK_UPDATE",
                recipientUserId,
                recipientEmail,
                recipientName,
                subject,
                "FEEDBACK_UPDATE",
                data,
                "NORMAL",
                idempotencyKey,
                false
        );
    }

    /**
     * Sends a test email to verify SMTP transport.
     */
    public void sendTestEmail(String recipientEmail, String subject, String testCategory) {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "This is an automated SMTP verification email generated by MediStock Pharmacy System. If you received this message, SMTP mail routing, TLS handshaking, and HTML rendering are functioning properly.");
        data.put("testCategory", testCategory != null ? testCategory : "SYSTEM_TEST");

        String finalSubject = subject != null && !subject.isBlank() ? subject : "[TEST] MediStock SMTP Connectivity Verification";
        String idempotencyKey = "TEST-EMAIL-" + System.currentTimeMillis();

        sendEmail(
                "SYSTEM_TEST",
                null,
                recipientEmail,
                "MediStock Administrator",
                finalSubject,
                "GENERAL",
                data,
                "NORMAL",
                idempotencyKey,
                true // Mandatory test email
        );
    }
}
