package com.medistock.medistock.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medistock.medistock.entity.EmailNotificationLog;
import com.medistock.medistock.entity.EmailOutbox;
import com.medistock.medistock.repository.EmailNotificationLogRepository;
import com.medistock.medistock.repository.EmailOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class EmailOutboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(EmailOutboxProcessor.class);

    private final EmailOutboxRepository outboxRepository;
    private final EmailNotificationLogRepository logRepository;
    private final EmailSenderService senderService;
    private final EmailTemplateService templateService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EmailOutboxProcessor(EmailOutboxRepository outboxRepository,
                                EmailNotificationLogRepository logRepository,
                                EmailSenderService senderService,
                                EmailTemplateService templateService) {
        this.outboxRepository = outboxRepository;
        this.logRepository = logRepository;
        this.senderService = senderService;
        this.templateService = templateService;
    }

    /**
     * Immediately processes a newly queued outbox record in a background thread.
     */
    @Async
    public void processSingleOutboxAsync(Long outboxId) {
        if (outboxId == null) return;
        Optional<EmailOutbox> opt = outboxRepository.findById(outboxId);
        opt.ifPresent(this::processItem);
    }

    /**
     * Periodic poller (runs every 5 seconds) to process pending items and retry eligible failed ones.
     */
    @Scheduled(fixedDelay = 5000)
    public void scheduledOutboxSweeper() {
        LocalDateTime now = LocalDateTime.now();
        List<EmailOutbox> pending = outboxRepository.findPendingOrEligibleForRetry(now, PageRequest.of(0, 20));

        if (!pending.isEmpty()) {
            log.debug("[EmailOutboxProcessor] Found {} pending/retry email(s) in queue", pending.size());
            for (EmailOutbox item : pending) {
                processItem(item);
            }
        }
    }

    /**
     * Executes the delivery attempt for a single outbox record.
     */
    @Transactional
    public synchronized void processItem(EmailOutbox item) {
        if (item == null) return;

        // Reload to prevent race conditions
        Optional<EmailOutbox> freshOpt = outboxRepository.findById(item.getOutboxId());
        if (freshOpt.isEmpty()) return;
        EmailOutbox outbox = freshOpt.get();

        if ("SENT".equals(outbox.getStatus()) || "CANCELLED".equals(outbox.getStatus())) {
            return;
        }

        outbox.setStatus("PROCESSING");
        outboxRepository.saveAndFlush(outbox);

        Map<String, Object> data = new HashMap<>();
        if (outbox.getTemplateDataJson() != null && !outbox.getTemplateDataJson().isBlank()) {
            try {
                data = objectMapper.readValue(outbox.getTemplateDataJson(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("[EmailOutboxProcessor] Could not deserialize templateDataJson: {}", e.getMessage());
            }
        }

        try {
            String htmlContent = templateService.renderEmail(
                    outbox.getTemplateName(),
                    outbox.getRecipientName(),
                    outbox.getSubject(),
                    data
            );

            // Transmit via SMTP or simulated sandbox
            senderService.sendHtmlEmail(outbox.getRecipientEmail(), outbox.getSubject(), htmlContent);

            outbox.setStatus("SENT");
            outbox.setProcessedAt(LocalDateTime.now());
            outbox.setErrorMessage(null);
            outboxRepository.save(outbox);

            // Record delivery log
            EmailNotificationLog logEntry = new EmailNotificationLog();
            logEntry.setOutboxId(outbox.getOutboxId());
            logEntry.setRecipientUserId(outbox.getRecipientUserId());
            logEntry.setRecipientEmail(outbox.getRecipientEmail());
            logEntry.setNotificationType(outbox.getEventType());
            logEntry.setSubject(outbox.getSubject());
            logEntry.setDeliveryStatus("SUBMITTED");
            logEntry.setRetryCount(outbox.getAttempts());
            logRepository.save(logEntry);

            log.info("[EmailOutboxProcessor] Outbox #{} successfully delivered to <{}>", outbox.getOutboxId(), outbox.getRecipientEmail());
        } catch (Exception ex) {
            int newAttempts = outbox.getAttempts() + 1;
            outbox.setAttempts(newAttempts);
            outbox.setErrorMessage(ex.getMessage() != null ? ex.getMessage() : "Unknown SMTP transmission error");

            if (newAttempts >= outbox.getMaxAttempts()) {
                outbox.setStatus("FAILED");
                outbox.setNextRetryAt(null);
                log.error("[EmailOutboxProcessor] Outbox #{} exceeded max attempts ({}). Marked as FAILED.", outbox.getOutboxId(), outbox.getMaxAttempts());

                EmailNotificationLog failureLog = new EmailNotificationLog();
                failureLog.setOutboxId(outbox.getOutboxId());
                failureLog.setRecipientUserId(outbox.getRecipientUserId());
                failureLog.setRecipientEmail(outbox.getRecipientEmail());
                failureLog.setNotificationType(outbox.getEventType());
                failureLog.setSubject(outbox.getSubject());
                failureLog.setDeliveryStatus("FAILED");
                failureLog.setRetryCount(newAttempts);
                failureLog.setErrorMessage(outbox.getErrorMessage());
                logRepository.save(failureLog);
            } else {
                outbox.setStatus("PENDING");
                // Exponential backoff: 1 min, 4 mins, 9 mins
                int delayMinutes = newAttempts * newAttempts;
                outbox.setNextRetryAt(LocalDateTime.now().plusMinutes(delayMinutes));
                log.warn("[EmailOutboxProcessor] Outbox #{} failed attempt {}/{}. Next retry in {} min(s)",
                        outbox.getOutboxId(), newAttempts, outbox.getMaxAttempts(), delayMinutes);
            }
            outboxRepository.save(outbox);
        }
    }

    /**
     * Admin manually forces a retry for a specific outbox item.
     */
    @Transactional
    public EmailOutbox manualRetry(Long outboxId) {
        EmailOutbox outbox = outboxRepository.findById(outboxId)
                .orElseThrow(() -> new IllegalArgumentException("Outbox item #" + outboxId + " not found"));

        outbox.setStatus("PENDING");
        outbox.setAttempts(0);
        outbox.setNextRetryAt(LocalDateTime.now());
        outbox.setErrorMessage(null);
        EmailOutbox saved = outboxRepository.save(outbox);

        // Trigger immediate retry
        processSingleOutboxAsync(saved.getOutboxId());
        return saved;
    }
}
