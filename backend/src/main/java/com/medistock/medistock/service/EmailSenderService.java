package com.medistock.medistock.service;

import com.medistock.medistock.dto.email.SmtpConnectionStatusDto;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${medistock.mail.from:noreply@medistock.com}")
    private String defaultFrom;

    @Value("${medistock.mail.from-name:MediStock Pharmacy Inventory}")
    private String fromName;

    @Value("${medistock.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${medistock.mail.mock-mode:auto}")
    private String mockMode;

    /**
     * Sends an HTML email via SMTP or simulated sandbox mode.
     * Returns true on successful submission.
     */
    public boolean sendHtmlEmail(String toEmail, String subject, String htmlContent) throws Exception {
        if (!mailEnabled) {
            log.info("[EmailSender] Email system disabled via configuration. Skipping delivery to {}", toEmail);
            return true;
        }

        boolean hasCredentials = mailUsername != null && !mailUsername.isBlank() && mailPassword != null && !mailPassword.isBlank();
        boolean isMock = "true".equalsIgnoreCase(mockMode) || ("auto".equalsIgnoreCase(mockMode) && !hasCredentials);

        if (isMock) {
            log.info("[EmailSender - Simulated SMTP] To: <{}> | Subject: '{}' | Mock Mode: {}", toEmail, subject, mockMode);
            // Simulate minimal network transport delay
            Thread.sleep(50);
            return true;
        }

        if (mailSender == null) {
            throw new IllegalStateException("JavaMailSender bean is not configured in Spring context");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(defaultFrom, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[EmailSender - Live SMTP] Successfully sent email to <{}> with subject '{}'", toEmail, subject);
            return true;
        } catch (Exception ex) {
            log.error("[EmailSender - SMTP Failed] Error transmitting to <{}>: {}", toEmail, ex.getMessage());
            throw ex;
        }
    }

    /**
     * Tests connectivity to the configured SMTP server without attempting authentication with blank creds.
     */
    public SmtpConnectionStatusDto testSmtpConnection() {
        SmtpConnectionStatusDto status = new SmtpConnectionStatusDto();
        status.setHost(mailHost);
        status.setPort(mailPort);
        status.setProtocol("SMTP");
        status.setAuthConfigured(mailUsername != null && !mailUsername.isBlank());
        status.setStartTlsEnabled(mailPort == 587 || mailPort == 465);

        long start = System.currentTimeMillis();
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(mailHost, mailPort), 5000);
            long latency = System.currentTimeMillis() - start;
            status.setConnected(true);
            status.setLatencyMs(latency);
            status.setStatusMessage("Successfully connected to " + mailHost + ":" + mailPort + " in " + latency + "ms.");
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            status.setConnected(false);
            status.setLatencyMs(latency);
            status.setStatusMessage("Connection failed: " + e.getMessage() + " (tested " + mailHost + ":" + mailPort + ")");
        }

        return status;
    }

    public String getDefaultFrom() {
        return defaultFrom;
    }

    public String getMailHost() {
        return mailHost;
    }

    public int getMailPort() {
        return mailPort;
    }

    public boolean isConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }
}

