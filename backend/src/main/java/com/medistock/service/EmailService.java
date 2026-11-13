
package com.medistock.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send an HTML email.
     *
     * @param recipient recipient email address
     * @param subject email subject
     * @param htmlContent HTML email body
     */
    public void sendHtmlEmail(
            String recipient,
            String subject,
            String htmlContent
    ) throws MessagingException, MailException {

        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException(
                    "Recipient email address is required."
            );
        }

        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException(
                    "Email subject is required."
            );
        }

        if (htmlContent == null || htmlContent.isBlank()) {
            throw new IllegalArgumentException(
                    "Email content is required."
            );
        }

        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper = new MimeMessageHelper(
                message,
                true,
                "UTF-8"
        );

        helper.setFrom(senderEmail);
        helper.setTo(recipient.trim());
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    /**
     * Send a plain-text email.
     */
    
public void sendTextEmail(
        String recipient,
        String subject,
        String content
) {

    if (recipient == null || recipient.isBlank()) {
        throw new IllegalArgumentException("Recipient email address is required.");
    }

    if (subject == null || subject.isBlank()) {
        throw new IllegalArgumentException("Email subject is required.");
    }

    if (content == null || content.isBlank()) {
        throw new IllegalArgumentException("Email content is required.");
    }

    MimeMessage message = mailSender.createMimeMessage();

    try {
        MimeMessageHelper helper =
                new MimeMessageHelper(message, false, "UTF-8");

        helper.setFrom(senderEmail);
        helper.setTo(recipient.trim());
        helper.setSubject(subject);
        helper.setText(content, false);

        mailSender.send(message);

    } catch (MessagingException exception) {
        throw new IllegalStateException(
                "Could not prepare email message.",
                exception
        );
    }
}

}
