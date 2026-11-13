package com.medistock.backend.service;

import com.medistock.backend.entity.Role;
import com.medistock.backend.entity.User;
import com.medistock.backend.repository.UserRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.List;

/** Sends an email and/or a text message to people about something that happened. Each channel can be switched off in Settings. */
@Service
public class NotificationService {
    private final UserRepository users;
    private final EmailService email;
    private final SmsService sms;
    private final SettingsService settings;

    public NotificationService(UserRepository users, EmailService email, SmsService sms, SettingsService settings) {
        this.users = users; this.email = email; this.sms = sms; this.settings = settings;
    }

    @Async
    public void toRole(Role role, String subject, String message) {
        toUsers(users.findAll().stream().filter(u -> u.getRole() == role).toList(), subject, message);
    }

    @Async
    public void toUsers(List<User> recipients, String subject, String message) {
        List<User> active = recipients.stream().filter(User::isEnabled).toList();
        if (active.isEmpty()) return;
        if (settings.eventEmails())
            email.sendText(active.stream().map(User::getEmail).distinct().toList(), "MediStock: " + subject, message);
        if (settings.eventSms())
            active.forEach(u -> sms.send(u.getPhone(), "MediStock: " + subject + ". " + message));
    }

    /** Sends a test to one person on both channels, whatever the switches say, and reports what happened. */
    public String sendTest(User u) {
        email.sendText(List.of(u.getEmail()), "MediStock: test notification", "This is a test message from MediStock.");
        sms.send(u.getPhone(), "MediStock: this is a test message.");
        return "Test sent to " + u.getEmail() + (sms.live() ? " and by SMS to " + u.getPhone() + "." : ". SMS is not set up, so it was only written to the server log.");
    }
}
