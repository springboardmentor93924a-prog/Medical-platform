package com.medistock.medistock.service;

import com.medistock.medistock.entity.EmailOutbox;
import com.medistock.medistock.event.MediStockEmailEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class EmailEventListener {

    private static final Logger log = LoggerFactory.getLogger(EmailEventListener.class);

    private final EmailOutboxService outboxService;
    private final EmailOutboxProcessor outboxProcessor;

    public EmailEventListener(EmailOutboxService outboxService,
                              EmailOutboxProcessor outboxProcessor) {
        this.outboxService = outboxService;
        this.outboxProcessor = outboxProcessor;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEmailEvent(MediStockEmailEvent event) {
        log.info("[EmailEventListener] Received email event '{}' for <{}>", event.getEventType(), event.getRecipientEmail());
        try {
            EmailOutbox outbox = outboxService.queueEmail(event);
            if (outbox != null && "PENDING".equals(outbox.getStatus())) {
                outboxProcessor.processSingleOutboxAsync(outbox.getOutboxId());
            }
        } catch (Exception e) {
            log.error("[EmailEventListener] Error queueing email event: {}", e.getMessage(), e);
        }
    }
}

