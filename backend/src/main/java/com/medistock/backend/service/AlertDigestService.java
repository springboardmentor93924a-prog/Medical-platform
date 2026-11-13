package com.medistock.backend.service;

import com.medistock.backend.dto.AlertDtos.AlertResponse;
import com.medistock.backend.entity.Role;
import com.medistock.backend.entity.User;
import com.medistock.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;

/** Emails one summary of all current stock and expiry alerts to every active Admin and Pharmacist. */
@Service
public class AlertDigestService {
    private static final Logger log = LoggerFactory.getLogger(AlertDigestService.class);

    private final AlertService alerts;
    private final UserRepository users;
    private final EmailService email;
    private final SettingsService settings;

    public AlertDigestService(AlertService alerts, UserRepository users, EmailService email, SettingsService settings) {
        this.alerts = alerts; this.users = users; this.email = email; this.settings = settings;
    }

    // Default: every day at 08:00 India time. Change with app.alerts.email.cron and app.alerts.email.zone.
    @Scheduled(cron = "${app.alerts.email.cron:0 0 8 * * *}", zone = "${app.alerts.email.zone:Asia/Kolkata}")
    public void scheduledDigest() {
        if (!settings.dailyAlertEmail()) return;   // switched on or off in Settings
        int sent = sendDigest();
        log.info("Daily alert email: {} alerts", sent);
    }

    /** Returns how many alerts were included. 0 means nothing was sent. */
    public int sendDigest() {
        List<AlertResponse> list = alerts.listAll();
        if (list.isEmpty()) return 0;
        List<String> to = users.findAll().stream()
            .filter(u -> u.isEnabled() && (u.getRole() == Role.ADMIN || u.getRole() == Role.PHARMACIST))
            .map(User::getEmail).toList();
        if (to.isEmpty()) return 0;

        StringBuilder body = new StringBuilder("MediStock alert summary\n");
        appendSection(body, "Needs action now", list.stream().filter(a -> a.severity().equals("critical")).toList());
        appendSection(body, "Keep an eye on", list.stream().filter(a -> !a.severity().equals("critical")).toList());
        body.append("\nOpen the Alerts page in MediStock to take action.");
        email.sendText(to, "MediStock: " + list.size() + " alerts need your attention", body.toString());
        return list.size();
    }

    private static void appendSection(StringBuilder body, String heading, List<AlertResponse> items) {
        if (items.isEmpty()) return;
        body.append("\n").append(heading).append(":\n");
        for (AlertResponse a : items) body.append(" - ").append(a.title()).append(". ").append(a.detail()).append("\n");
    }
}
