package com.medistock.medistock.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medistock.medistock.entity.EmailOutbox;
import com.medistock.medistock.event.MediStockEmailEvent;
import com.medistock.medistock.repository.EmailOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class EmailOutboxService {

    private static final Logger log = LoggerFactory.getLogger(EmailOutboxService.class);

    private final EmailOutboxRepository outboxRepository;
    private final EmailPreferenceService preferenceService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ApplicationEventPublisher eventPublisher;

    public EmailOutboxService(EmailOutboxRepository outboxRepository,
                              EmailPreferenceService preferenceService,
                              ApplicationEventPublisher eventPublisher) {
        this.outboxRepository = outboxRepository;
        this.preferenceService = preferenceService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Queues an email into the transactional outbox table.
     * Prevents duplicate events using idempotency keys.
     * Respects user notification preferences.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public EmailOutbox queueEmail(MediStockEmailEvent event) {
        if (event == null || event.getRecipientEmail() == null || event.getRecipientEmail().isBlank()) {
            log.warn("[EmailOutbox] Refusing to queue email event with blank recipient");
            return null;
        }

        // Check if an outbox record with this idempotency key already exists
        if (event.getIdempotencyKey() != null && !event.getIdempotencyKey().isBlank()) {
            Optional<EmailOutbox> existing = outboxRepository.findByIdempotencyKey(event.getIdempotencyKey());
            if (existing.isPresent()) {
                log.info("[EmailOutbox] Idempotent email skipped: key '{}' already queued (status={})",
                        event.getIdempotencyKey(), existing.get().getStatus());
                return existing.get();
            }
        }

        // Map eventType to preference category
        String category = mapEventTypeToCategory(event.getEventType());

        // Check if user has opted out of this category
        boolean allowed = event.isMandatory() || preferenceService.isEmailEnabled(event.getRecipientUserId(), category);

        EmailOutbox outbox = new EmailOutbox();
        outbox.setIdempotencyKey(event.getIdempotencyKey() != null && !event.getIdempotencyKey().isBlank()
                ? event.getIdempotencyKey()
                : "EVT-" + System.currentTimeMillis() + "-" + UUID_SHORT());
        outbox.setEventType(event.getEventType());
        outbox.setRecipientUserId(event.getRecipientUserId());
        outbox.setRecipientEmail(event.getRecipientEmail());
        outbox.setRecipientName(event.getRecipientName());
        outbox.setSubject(event.getSubject());
        outbox.setTemplateName(event.getTemplateName());
        outbox.setPriority(event.getPriority());
        outbox.setAttempts(0);
        outbox.setMaxAttempts(3);

        try {
            outbox.setTemplateDataJson(objectMapper.writeValueAsString(event.getTemplateData() != null ? event.getTemplateData() : Map.of()));
        } catch (JsonProcessingException e) {
            log.error("[EmailOutbox] Failed to serialize template data to JSON: {}", e.getMessage());
            outbox.setTemplateDataJson("{}");
        }

        if (!allowed) {
            log.info("[EmailOutbox] User {} has disabled '{}' emails. Flagging as CANCELLED.",
                    event.getRecipientUserId(), category);
            outbox.setStatus("CANCELLED");
            outbox.setErrorMessage("Skipped: User disabled email notifications for " + category);
            outbox.setProcessedAt(LocalDateTime.now());
        } else {
            outbox.setStatus("PENDING");
            outbox.setNextRetryAt(LocalDateTime.now());
        }

        EmailOutbox saved = outboxRepository.save(outbox);
        log.info("[EmailOutbox] Saved outbox record #{} for <{}> [{}]", saved.getOutboxId(), saved.getRecipientEmail(), saved.getStatus());
        return saved;
    }

    public String mapEventTypeToCategory(String eventType) {
        if (eventType == null) return "GENERAL";
        String upper = eventType.toUpperCase();

        if (upper.contains("PURCHASE") || upper.contains("PO_")) return "PURCHASE_ORDERS";
        if (upper.contains("LOW_STOCK") || upper.contains("RESTOCK") || upper.contains("DISCREPANCY")) return "INVENTORY_ALERTS";
        if (upper.contains("EXPIR") || upper.contains("FEFO")) return "EXPIRY_FEFO";
        if (upper.contains("TASK")) return "TASKS";
        if (upper.contains("FEEDBACK") || upper.contains("TICKET")) return "FEEDBACK";
        if (upper.contains("DIGEST") || upper.contains("SUMMARY")) return "DAILY_DIGEST";
        if (upper.contains("SECURITY") || upper.contains("BACKUP") || upper.contains("RESTORE")) return "SECURITY_ALERTS";

        return "GENERAL";
    }

    private String UUID_SHORT() {
        return Long.toHexString(Double.doubleToLongBits(Math.random()));
    }
}
