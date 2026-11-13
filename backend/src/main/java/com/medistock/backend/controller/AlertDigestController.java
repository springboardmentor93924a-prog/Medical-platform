package com.medistock.backend.controller;

import com.medistock.backend.dto.AuthDtos.MessageResponse;
import com.medistock.backend.service.AlertDigestService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
public class AlertDigestController {
    private final AlertDigestService service;

    public AlertDigestController(AlertDigestService service) { this.service = service; }

    /** Sends the alert summary now, so it can be tested without waiting for the daily time. */
    @PostMapping("/digest")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse sendNow() {
        int count = service.sendDigest();
        return new MessageResponse(count == 0 ? "No alerts to send." : "Alert summary sent (" + count + " alerts).");
    }
}
