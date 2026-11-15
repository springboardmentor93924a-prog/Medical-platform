
package com.medistock.controller;

import com.medistock.service.EmailService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class EmailTestController {

    private final EmailService emailService;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public EmailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Send a test message so an administrator can confirm the SMTP
     * settings work. The recipient defaults to the configured sender.
     */
    @PostMapping("/email-test")
    public ResponseEntity<Map<String, String>> sendTestEmail(
            @RequestBody(required = false) Map<String, String> body
    ) {

        if (senderEmail == null || senderEmail.isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "message",
                            "SMTP is not configured on this server. "
                                    + "Set MAIL_USERNAME and MAIL_PASSWORD "
                                    + "in the API environment, then redeploy."
                    ));
        }

        String recipient = body == null
                ? null
                : body.get("recipient");

        if (recipient == null || recipient.isBlank()) {
            recipient = senderEmail;
        }

        try {
            emailService.sendTextEmail(
                    recipient,
                    "MediStock SMTP Test",
                    "Hello!\n\n"
                            + "Your MediStock SMTP email configuration "
                            + "is working successfully.\n\n"
                            + "This is a test email."
            );

            return ResponseEntity.ok(Map.of(
                    "message",
                    "Test email sent successfully to " + recipient
            ));

        } catch (IllegalArgumentException exception) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            exception.getMessage() == null
                                    ? "Invalid test email request."
                                    : exception.getMessage()
                    ));

        } catch (MailException | IllegalStateException exception) {

            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "message",
                            "Email sending failed. Check the SMTP "
                                    + "configuration and API logs."
                    ));
        }
    }
}
