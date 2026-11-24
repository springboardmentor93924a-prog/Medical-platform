package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.email.EmailMonitoringStatsDto;
import com.medistock.medistock.dto.email.SendTestEmailRequest;
import com.medistock.medistock.dto.email.SmtpConnectionStatusDto;
import com.medistock.medistock.entity.EmailNotificationLog;
import com.medistock.medistock.entity.EmailOutbox;
import com.medistock.medistock.repository.EmailNotificationLogRepository;
import com.medistock.medistock.repository.EmailOutboxRepository;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import com.medistock.medistock.service.EmailNotificationService;
import com.medistock.medistock.service.EmailOutboxProcessor;
import com.medistock.medistock.service.EmailSenderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/email-monitoring")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailMonitoringController {

    private final EmailOutboxRepository outboxRepository;
    private final EmailNotificationLogRepository logRepository;
    private final EmailOutboxProcessor outboxProcessor;
    private final EmailSenderService senderService;
    private final EmailNotificationService notificationService;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public AdminEmailMonitoringController(EmailOutboxRepository outboxRepository,
                                          EmailNotificationLogRepository logRepository,
                                          EmailOutboxProcessor outboxProcessor,
                                          EmailSenderService senderService,
                                          EmailNotificationService notificationService,
                                          CurrentUserService currentUserService,
                                          AuditService auditService) {
        this.outboxRepository = outboxRepository;
        this.logRepository = logRepository;
        this.outboxProcessor = outboxProcessor;
        this.senderService = senderService;
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<EmailMonitoringStatsDto>> getMonitoringStats() {
        EmailMonitoringStatsDto stats = new EmailMonitoringStatsDto();

        long totalOutbox = outboxRepository.count();
        long sent = outboxRepository.countByStatus("SENT");
        long pending = outboxRepository.countPendingQueue();
        long failed = outboxRepository.countByStatus("FAILED");
        long totalLogged = logRepository.count();

        stats.setTotalOutbox(totalOutbox);
        stats.setSentCount(sent);
        stats.setPendingCount(pending);
        stats.setFailedCount(failed);
        stats.setTotalLogged(totalLogged);

        double rate = totalOutbox > 0 ? ((double) sent / totalOutbox) * 100.0 : 100.0;
        stats.setSuccessRatePercent(Math.round(rate * 10.0) / 10.0);

        stats.setSmtpConfigured(senderService.isConfigured());
        stats.setSmtpHost(senderService.getMailHost());
        stats.setSmtpPort(senderService.getMailPort());
        stats.setSenderFrom(senderService.getDefaultFrom());

        Map<String, Long> statusMap = new HashMap<>();
        statusMap.put("SENT", sent);
        statusMap.put("PENDING", pending);
        statusMap.put("FAILED", failed);
        stats.setCountByStatus(statusMap);

        Map<String, Long> typeMap = new HashMap<>();
        for (Object[] row : outboxRepository.countGroupedByEventType()) {
            if (row != null && row.length >= 2 && row[0] != null) {
                typeMap.put(String.valueOf(row[0]), (Long) row[1]);
            }
        }
        stats.setCountByEventType(typeMap);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/outbox")
    public ResponseEntity<ApiResponse<List<EmailOutbox>>> getOutboxItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String status) {

        List<EmailOutbox> list;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = outboxRepository.findAll(
                    (root, query, cb) -> cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()),
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent();
        } else {
            list = outboxRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        }

        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<EmailNotificationLog>>> getEmailLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        List<EmailNotificationLog> list = logRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"))).getContent();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/retry/{outboxId}")
    public ResponseEntity<ApiResponse<EmailOutbox>> retryOutboxItem(
            @PathVariable Long outboxId,
            HttpServletRequest request) {

        EmailOutbox retried = outboxProcessor.manualRetry(outboxId);

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "RETRY_EMAIL_NOTIFICATION",
                "EMAIL_OUTBOX",
                outboxId.intValue(),
                "Manually triggered email delivery retry for outbox #" + outboxId + " to " + retried.getRecipientEmail(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Email retry initiated successfully", retried));
    }

    @PostMapping("/test-connection")
    public ResponseEntity<ApiResponse<SmtpConnectionStatusDto>> testSmtpConnection() {
        SmtpConnectionStatusDto status = senderService.testSmtpConnection();
        return ResponseEntity.ok(ApiResponse.ok(status.getStatusMessage(), status));
    }

    @PostMapping("/send-test")
    public ResponseEntity<ApiResponse<Void>> sendTestEmail(
            @RequestBody SendTestEmailRequest req,
            HttpServletRequest request) {

        if (req == null || req.getRecipientEmail() == null || req.getRecipientEmail().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required"));
        }

        notificationService.sendTestEmail(
                req.getRecipientEmail().trim(),
                req.getSubject(),
                req.getTestCategory()
        );

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "SEND_TEST_EMAIL",
                "SMTP",
                null,
                "Triggered test verification email to " + req.getRecipientEmail().trim(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Test email queued for delivery to " + req.getRecipientEmail(), null));
    }
}

