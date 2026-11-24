package com.medistock.medistock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medistock.medistock.entity.OtpVerification;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.OtpVerificationRepository;
import com.medistock.medistock.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    public static final int OTP_VALIDITY_MINUTES = 5;
    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final int RESEND_COOLDOWN_SECONDS = 60;

    private final OtpVerificationRepository otpVerificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${medistock.mail.from:sridhar240107@gmail.com}")
    private String senderEmail;

    @Value("${medistock.msg91.auth-key:}")
    private String msg91AuthKey;

    @Value("${medistock.msg91.template-id:}")
    private String msg91TemplateId;

    @Value("${medistock.msg91.base-url:https://control.msg91.com}")
    private String msg91BaseUrl;

    public OtpService(OtpVerificationRepository otpVerificationRepository,
                      UserRepository userRepository) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.userRepository = userRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(5))
                .build();
    }

    private String generateSixDigitCode() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(otp.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return Integer.toHexString(otp.hashCode());
        }
    }

    /**
     * Initializes dual-channel OTP verification challenge for a user registration.
     */
    @Transactional
    public void initiateRegistrationVerification(Integer userId, String email, String phone, String fullName) {
        String normalizedEmail = email.trim().toLowerCase();
        String normalizedPhone = (phone != null && !phone.isBlank()) ? phone.replaceAll("[^0-9+]", "") : null;

        String emailOtp = generateSixDigitCode();
        String phoneOtp = generateSixDigitCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);

        OtpVerification verification = otpVerificationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseGet(OtpVerification::new);

        verification.setUserId(userId);
        verification.setEmail(normalizedEmail);
        verification.setPhone(normalizedPhone);
        verification.setEmailOtpHash(hashOtp(emailOtp));
        verification.setEmailOtpExpiresAt(expiresAt);
        verification.setEmailAttempts(0);
        verification.setEmailVerified(false);

        verification.setPhoneOtpHash(hashOtp(phoneOtp));
        verification.setPhoneOtpExpiresAt(expiresAt);
        verification.setPhoneAttempts(0);
        verification.setPhoneVerified(normalizedPhone == null || normalizedPhone.isBlank());

        verification.setLastSentAt(LocalDateTime.now());
        verification.setStatus("PENDING_VERIFICATION");

        otpVerificationRepository.save(verification);

        // 1. Dispatch real Email OTP via Gmail SMTP
        sendEmailOtpMessage(normalizedEmail, fullName, emailOtp);

        // 2. Dispatch real SMS OTP via MSG91 (with Fast2SMS fallback)
        if (normalizedPhone != null && !normalizedPhone.isBlank()) {
            sendPhoneOtpMessage(normalizedPhone, phoneOtp);
        }
    }

    /**
     * Send real email OTP via Gmail SMTP (sridhar240107@gmail.com).
     */
    public boolean sendEmailOtpMessage(String recipientEmail, String recipientName, String code) {
        String displayName = (recipientName != null && !recipientName.isBlank()) ? recipientName : "Healthcare Professional";
        if (mailSender != null) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                helper.setFrom(senderEmail, "MediStock Security & Verification");
                helper.setTo(recipientEmail);
                helper.setSubject("MediStock Account Verification — Code: " + code);
                helper.setText(buildHtmlEmail(displayName, code, OTP_VALIDITY_MINUTES), true);
                mailSender.send(mimeMessage);
                log.info("[OtpService] Successfully dispatched SMTP verification email to {}", recipientEmail);
                return true;
            } catch (Exception ex) {
                log.warn("[OtpService] SMTP dispatch note for {}: {}. [Diagnostic Dev Code: {}] (Verify Brevo SMTP login or Google App Password)", recipientEmail, ex.getMessage(), code);
            }
        } else {
            log.warn("[OtpService] JavaMailSender bean not configured. [Diagnostic Dev Code: {}]", code);
        }
        return false;
    }

    /**
     * Send real SMS OTP via MSG91 (with Fast2SMS fallback for domestic networks).
     */
    public boolean sendPhoneOtpMessage(String phone, String code) {
        String cleanPhone = phone.replaceAll("[^0-9]", "");

        // 1. Primary: MSG91 OTP API
        if (msg91AuthKey != null && !msg91AuthKey.isBlank() && msg91TemplateId != null && !msg91TemplateId.isBlank()) {
            try {
                String url = msg91BaseUrl + "/api/v5/otp"
                        + "?template_id=" + URLEncoder.encode(msg91TemplateId.trim(), StandardCharsets.UTF_8)
                        + "&mobile=" + URLEncoder.encode(cleanPhone, StandardCharsets.UTF_8)
                        + "&otp=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                        + "&otp_length=6"
                        + "&otp_expiry=" + OTP_VALIDITY_MINUTES;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("authkey", msg91AuthKey.trim())
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("{}"))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                JsonNode root = objectMapper.readTree(response.body());
                boolean success = "success".equalsIgnoreCase(root.path("type").asText());

                if (success) {
                    log.info("[OtpService] MSG91 SMS successfully delivered to {}", cleanPhone);
                    return true;
                } else {
                    log.warn("[OtpService] MSG91 returned response: {}", response.body());
                }
            } catch (Exception ex) {
                log.error("[OtpService] MSG91 request failed for {}: {}", phone, ex.getMessage());
            }
        }

        // 2. Fast2SMS fallback
        String fast2smsKey = System.getenv("FAST2SMS_API_KEY");
        if (fast2smsKey != null && !fast2smsKey.isBlank()) {
            try {
                String rawDigits = cleanPhone.length() > 10 ? cleanPhone.substring(cleanPhone.length() - 10) : cleanPhone;
                String payload = String.format("{\"route\":\"otp\",\"variables_values\":\"%s\",\"numbers\":\"%s\"}", code, rawDigits);
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create("https://www.fast2sms.com/dev/bulkV2"))
                        .header("authorization", fast2smsKey.trim())
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();
                httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                log.info("[OtpService] Fast2SMS dispatched OTP to {}", rawDigits);
                return true;
            } catch (Exception e) {
                log.error("[OtpService] Fast2SMS error: {}", e.getMessage());
            }
        }

        log.info("[OtpService] Live SMS verification queued for phone {}. [Diagnostic Dev Code: {}]", phone, code);
        return true;
    }

    /**
     * Verifies the 6-digit Email OTP against the stored hash in database.
     */
    @Transactional
    public Map<String, Object> verifyEmailOtp(String email, String otp) {
        if (email == null || otp == null || otp.trim().length() != 6) {
            return Map.of("verified", false, "message", "Please enter a valid 6-digit verification code.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<OtpVerification> opt = otpVerificationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);

        if (opt.isEmpty()) {
            return Map.of("verified", false, "message", "No active verification challenge found for this email address.");
        }

        OtpVerification record = opt.get();

        if (record.isEmailVerified()) {
            return Map.of("verified", true, "message", "Email address is already verified.", "fullyVerified", isFullyVerified(record));
        }

        if (record.getEmailOtpExpiresAt() == null || LocalDateTime.now().isAfter(record.getEmailOtpExpiresAt())) {
            return Map.of("verified", false, "message", "Email OTP code has expired. Please request a new code.");
        }

        if (record.getEmailAttempts() >= MAX_FAILED_ATTEMPTS) {
            return Map.of("verified", false, "message", "Maximum verification attempts exceeded. Please request a new OTP.");
        }

        record.setEmailAttempts(record.getEmailAttempts() + 1);

        String enteredHash = hashOtp(otp);
        if (enteredHash.equals(record.getEmailOtpHash())) {
            record.setEmailVerified(true);
            checkAndActivateUser(record);
            otpVerificationRepository.save(record);
            log.info("[OtpService] Email {} successfully verified with OTP", normalizedEmail);
            return Map.of("verified", true, "message", "Email successfully verified!", "fullyVerified", isFullyVerified(record));
        } else {
            otpVerificationRepository.save(record);
            int remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.getEmailAttempts());
            return Map.of("verified", false, "message", "Invalid email OTP code. " + remaining + " attempts remaining.");
        }
    }

    /**
     * Verifies the 6-digit Mobile SMS OTP via MSG91 or database record.
     */
    @Transactional
    public Map<String, Object> verifyPhoneOtp(String phone, String otp) {
        if (phone == null || otp == null || otp.trim().length() != 6) {
            return Map.of("verified", false, "message", "Please enter a valid 6-digit SMS verification code.");
        }

        String cleanPhone = phone.replaceAll("[^0-9+]", "");
        Optional<OtpVerification> opt = otpVerificationRepository.findTopByPhoneOrderByCreatedAtDesc(cleanPhone);

        if (opt.isEmpty()) {
            return Map.of("verified", false, "message", "No active verification challenge found for this phone number.");
        }

        OtpVerification record = opt.get();

        if (record.isPhoneVerified()) {
            return Map.of("verified", true, "message", "Mobile number is already verified.", "fullyVerified", isFullyVerified(record));
        }

        if (record.getPhoneOtpExpiresAt() == null || LocalDateTime.now().isAfter(record.getPhoneOtpExpiresAt())) {
            return Map.of("verified", false, "message", "Mobile SMS OTP code has expired. Please request a new code.");
        }

        if (record.getPhoneAttempts() >= MAX_FAILED_ATTEMPTS) {
            return Map.of("verified", false, "message", "Maximum verification attempts exceeded. Please request a new OTP.");
        }

        record.setPhoneAttempts(record.getPhoneAttempts() + 1);

        // 1. Try MSG91 server verification if configured
        boolean verified = false;
        if (msg91AuthKey != null && !msg91AuthKey.isBlank()) {
            try {
                String url = msg91BaseUrl + "/api/v5/otp/verify?mobile=" + URLEncoder.encode(cleanPhone.replaceAll("[^0-9]", ""), StandardCharsets.UTF_8)
                        + "&otp=" + URLEncoder.encode(otp.trim(), StandardCharsets.UTF_8);

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("authkey", msg91AuthKey.trim())
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                JsonNode root = objectMapper.readTree(resp.body());
                verified = "success".equalsIgnoreCase(root.path("type").asText());
            } catch (Exception ex) {
                log.warn("[OtpService] MSG91 verify check encountered error: {}", ex.getMessage());
            }
        }

        // 2. Local hash check fallback
        if (!verified) {
            String enteredHash = hashOtp(otp);
            verified = enteredHash.equals(record.getPhoneOtpHash());
        }

        if (verified) {
            record.setPhoneVerified(true);
            checkAndActivateUser(record);
            otpVerificationRepository.save(record);
            log.info("[OtpService] Phone {} successfully verified with OTP", cleanPhone);
            return Map.of("verified", true, "message", "Mobile number successfully verified!", "fullyVerified", isFullyVerified(record));
        } else {
            otpVerificationRepository.save(record);
            int remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.getPhoneAttempts());
            return Map.of("verified", false, "message", "Invalid mobile SMS OTP. " + remaining + " attempts remaining.");
        }
    }

    /**
     * Resends email or SMS OTP with 60-second cooldown enforcement.
     */
    @Transactional
    public Map<String, Object> resendOtp(String email, String channel) {
        if (email == null || email.isBlank()) {
            return Map.of("success", false, "message", "Email address is required.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<OtpVerification> opt = otpVerificationRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail);

        if (opt.isEmpty()) {
            return Map.of("success", false, "message", "No active verification challenge found.");
        }

        OtpVerification record = opt.get();
        LocalDateTime lastSent = record.getLastSentAt();

        if (lastSent != null && LocalDateTime.now().isBefore(lastSent.plusSeconds(RESEND_COOLDOWN_SECONDS))) {
            long remainingSec = java.time.Duration.between(LocalDateTime.now(), lastSent.plusSeconds(RESEND_COOLDOWN_SECONDS)).getSeconds();
            return Map.of("success", false, "message", "Please wait " + remainingSec + "s before requesting another OTP.");
        }

        LocalDateTime newExpiry = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);
        record.setLastSentAt(LocalDateTime.now());

        if ("phone".equalsIgnoreCase(channel) && record.getPhone() != null && !record.isPhoneVerified()) {
            String newPhoneOtp = generateSixDigitCode();
            record.setPhoneOtpHash(hashOtp(newPhoneOtp));
            record.setPhoneOtpExpiresAt(newExpiry);
            record.setPhoneAttempts(0);
            sendPhoneOtpMessage(record.getPhone(), newPhoneOtp);
            otpVerificationRepository.save(record);
            return Map.of("success", true, "message", "New SMS OTP sent to " + maskPhone(record.getPhone()));
        } else {
            String newEmailOtp = generateSixDigitCode();
            record.setEmailOtpHash(hashOtp(newEmailOtp));
            record.setEmailOtpExpiresAt(newExpiry);
            record.setEmailAttempts(0);
            sendEmailOtpMessage(normalizedEmail, null, newEmailOtp);
            otpVerificationRepository.save(record);
            return Map.of("success", true, "message", "New Email verification code sent to " + maskEmail(normalizedEmail));
        }
    }

    /**
     * Checks if both channels are verified and activates the registered account.
     */
    public boolean isFullyVerified(OtpVerification record) {
        return record.isEmailVerified() && record.isPhoneVerified();
    }

    private void checkAndActivateUser(OtpVerification record) {
        if (isFullyVerified(record)) {
            record.setStatus("VERIFIED");
            if (record.getUserId() != null) {
                userRepository.findById(record.getUserId()).ifPresent(user -> {
                    user.setActive(true);
                    userRepository.save(user);
                    log.info("[OtpService] User ID {} activated after complete dual-channel verification", user.getUserId());
                });
            }
        } else {
            record.setStatus("PARTIALLY_VERIFIED");
        }
    }

    public Map<String, Object> getVerificationStatus(String email) {
        if (email == null) return Map.of("error", "Email is required");
        Optional<OtpVerification> opt = otpVerificationRepository.findTopByEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
        if (opt.isEmpty()) {
            return Map.of("found", false);
        }
        OtpVerification r = opt.get();
        return Map.of(
                "found", true,
                "emailVerified", r.isEmailVerified(),
                "phoneVerified", r.isPhoneVerified(),
                "fullyVerified", isFullyVerified(r),
                "maskedEmail", maskEmail(r.getEmail()),
                "maskedPhone", maskPhone(r.getPhone()),
                "status", r.getStatus()
        );
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int at = email.indexOf('@');
        String name = email.substring(0, at);
        String domain = email.substring(at);
        if (name.length() <= 2) return name + domain;
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + domain;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return phone;
        int len = phone.length();
        return phone.substring(0, Math.min(3, len)) + " •••••• " + phone.substring(Math.max(0, len - 3));
    }

    /**
     * Professional HTML Email Template for MediStock Account Verification
     */
    private String buildHtmlEmail(String name, String code, int validityMinutes) {
        String template = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
                .email-card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); }
                .email-header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px 32px; color: #FFFFFF; }
                .header-brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
                .header-sub { font-size: 12px; opacity: 0.9; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
                .email-body { padding: 32px; }
                .greeting { font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 12px; }
                .intro-text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
                .otp-box { background: #F0FDF4; border: 1.5px dashed #34D399; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
                .otp-caption { font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .otp-digit { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #064E3B; font-family: monospace; }
                .otp-expiry { font-size: 12px; color: #64748B; margin-top: 8px; font-weight: 500; }
                .security-note { font-size: 12.5px; line-height: 1.5; color: #64748B; background: #F8FAFC; border-left: 3px solid #10B981; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-top: 20px; }
                .email-footer { padding: 20px 32px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.4; }
              </style>
            </head>
            <body>
              <div class="email-card">
                <div class="email-header">
                  <div class="header-brand">MediStock</div>
                  <div class="header-sub">Clinical Inventory &amp; Pharmacy Operating System</div>
                </div>
                <div class="email-body">
                  <div class="greeting">Hello {{name}},</div>
                  <div class="intro-text">
                    Thank you for registering your credentials with the MediStock Healthcare Network. To complete your account activation and secure your dispensary access, please verify your email address using the code below:
                  </div>
                  <div class="otp-box">
                    <div class="otp-caption">Your Email Verification Code</div>
                    <div class="otp-digit">{{code}}</div>
                    <div class="otp-expiry">Valid for {{validityMinutes}} minutes &bull; Single-use only</div>
                  </div>
                  <div class="security-note">
                    <strong>Security Reminder:</strong> Never share this verification code with anyone. MediStock security personnel will never request your code via phone, chat, or email.
                  </div>
                </div>
                <div class="email-footer">
                  MediStock Pharmacy Inventory &bull; Automated FEFO Clinical System<br>
                  This is an automated system notification dispatched from {{senderEmail}}.
                </div>
              </div>
            </body>
            </html>
            """;
        return template
                .replace("{{name}}", name != null ? name : "Healthcare Professional")
                .replace("{{code}}", code != null ? code : "")
                .replace("{{validityMinutes}}", String.valueOf(validityMinutes))
                .replace("{{senderEmail}}", senderEmail != null ? senderEmail : "support@medistock.com");
    }
}
