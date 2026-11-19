package com.medistock.backend.service;

import com.medistock.backend.entity.Role;
import com.medistock.backend.entity.User;
import com.medistock.backend.repository.UserRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.List;

/** Sends an email to people about something that happened. It can be switched off in Settings. */
@Service
public class NotificationService {
    private final UserRepository users;
    private final EmailService email;
    private final SettingsService settings;

    public NotificationService(UserRepository users, EmailService email, SettingsService settings) {
        this.users = users; this.email = email; this.settings = settings;
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
    }

    /** Sends a test email to one person, whatever the switch says. */
    public String sendTest(User u) {
        email.sendText(List.of(u.getEmail()), "MediStock: test notification", "This is a test message from MediStock.");
        return "Test sent to " + u.getEmail() + ".";
    }
}
