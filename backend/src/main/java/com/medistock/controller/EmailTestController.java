
package com.medistock.controller;

import com.medistock.service.EmailService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class EmailTestController {

    private final EmailService emailService;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/email-test")
    public ResponseEntity<String> sendTestEmail() {

        try {
            emailService.sendTextEmail(
                    senderEmail,
                    "MediStock SMTP Test",
                    "Hello!\n\n"
                            + "Your MediStock SMTP email configuration "
                            + "is working successfully.\n\n"
                            + "This is a test email."
            );

            return ResponseEntity.ok(
                    "Test email sent successfully to " + senderEmail
            );

        } catch (MailException | IllegalStateException exception) {

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Email sending failed. Check your SMTP configuration and backend logs.");
        }
    }
}
