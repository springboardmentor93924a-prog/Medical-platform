package com.medistock.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final ObjectProvider<JavaMailSender> mail;
    private final boolean enabled;
    private final String from;

    public EmailService(ObjectProvider<JavaMailSender> mail,
                        @Value("${app.mail.enabled}") boolean enabled,
                        @Value("${app.mail.from}") String from) {
        this.mail = mail; this.enabled = enabled; this.from = from;
    }

    public void sendPasswordReset(String to, String name, String link) {
        JavaMailSender sender = mail.getIfAvailable();
        if (!enabled || sender == null) {
            // Development mode: no SMTP needed. NEVER leave mail disabled in production.
            log.info("[DEV] Password reset link for {}: {}", to, link);
            return;
        }
        SimpleMailMessage m = new SimpleMailMessage();
        m.setFrom(from); m.setTo(to); m.setSubject("Reset your MediStock password");
        m.setText("Hi " + name + ",\n\nUse this link to reset your password. It expires in 15 minutes "
            + "and can be used once:\n\n" + link + "\n\nIf you did not request this, ignore this email.");
        try { sender.send(m); } catch (MailException e) { log.error("Could not send reset email", e); }
    }

    /** One message to many people. They are put in BCC so nobody sees the others' addresses. */
    public void sendText(List<String> bcc, String subject, String body) {
        JavaMailSender sender = mail.getIfAvailable();
        if (!enabled || sender == null) {
            log.info("[DEV] Email to {} recipients, subject '{}':\n{}", bcc.size(), subject, body);
            return;
        }
        SimpleMailMessage m = new SimpleMailMessage();
        m.setFrom(from);
        m.setTo(from);
        m.setBcc(bcc.toArray(new String[0]));
        m.setSubject(subject);
        m.setText(body);
        try { sender.send(m); } catch (MailException e) { log.error("Could not send email", e); }
    }
}
