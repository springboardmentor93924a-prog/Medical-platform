package com.medistock.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/** Sends text messages through Twilio. Without Twilio details, the message is only written to the server log. */
@Service
public class SmsService {
    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final boolean enabled;
    private final String sid, token, from, countryCode;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public SmsService(@Value("${app.sms.enabled:false}") boolean enabled,
                      @Value("${app.sms.twilio.sid:}") String sid,
                      @Value("${app.sms.twilio.token:}") String token,
                      @Value("${app.sms.twilio.from:}") String from,
                      @Value("${app.sms.default-country-code:+91}") String countryCode) {
        this.enabled = enabled; this.sid = sid; this.token = token; this.from = from; this.countryCode = countryCode;
    }

    public boolean live() { return enabled && !sid.isBlank() && !token.isBlank() && !from.isBlank(); }

    public void send(String phone, String text) {
        if (phone == null || phone.isBlank()) return;
        String to = phone.startsWith("+") ? phone : countryCode + phone;   // 10-digit numbers get the default country code
        String body = text.length() > 300 ? text.substring(0, 297) + "..." : text;
        if (!live()) {
            log.info("[DEV] SMS to {}: {}", to, body);
            return;
        }
        try {
            String form = "To=" + enc(to) + "&From=" + enc(from) + "&Body=" + enc(body);
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString((sid + ":" + token).getBytes(StandardCharsets.UTF_8)))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) log.error("Twilio refused the SMS to {}: HTTP {}", to, response.statusCode());
        } catch (Exception e) {
            log.error("Could not send SMS to {}", to, e);
        }
    }

    private static String enc(String s) { return URLEncoder.encode(s, StandardCharsets.UTF_8); }
}
