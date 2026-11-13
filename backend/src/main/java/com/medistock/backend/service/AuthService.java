package com.medistock.backend.service;

import com.medistock.backend.dto.AuthDtos.*;
import com.medistock.backend.entity.PasswordResetToken;
import com.medistock.backend.entity.Role;
import com.medistock.backend.entity.User;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.PasswordResetTokenRepository;
import com.medistock.backend.repository.UserRepository;
import com.medistock.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthService {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);
    private static final Duration RESET_TTL = Duration.ofMinutes(15);
    // Same message for wrong username, password or role: attackers learn nothing
    private static final String BAD_LOGIN = "Invalid username, password or role";
    private static final String BAD_RESET = "This reset link is invalid or has expired";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final EmailService email;
    private final String frontendUrl;
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordResetTokenRepository tokens, PasswordEncoder encoder,
                       JwtService jwt, EmailService email, @Value("${app.frontend-url}") String frontendUrl) {
        this.users = users; this.tokens = tokens; this.encoder = encoder; this.jwt = jwt;
        this.email = email; this.frontendUrl = frontendUrl;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    @Transactional
    public void signup(SignupRequest r) {
        String username = r.username().trim();
        String mail = r.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(mail))
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists", "email");
        if (users.existsByUsernameIgnoreCase(username))
            throw new ApiException(HttpStatus.CONFLICT, "This username is already taken", "username");

        User u = new User();
        u.setUsername(username);
        u.setEmail(mail);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setFullName(r.fullName().trim());
        u.setPhone(r.phone().trim());
        u.setRole(Role.valueOf(r.role().trim().toUpperCase()));
        users.save(u);
    }

    // No @Transactional on purpose: failed-attempt counters must be saved even though we throw afterwards
    public AuthResponse login(LoginRequest r) {
        User u = users.findByUsernameIgnoreCase(r.username().trim()).orElse(null);
        if (u == null) {
            encoder.matches(r.password(), dummyHash);   // keeps response time similar for unknown users
            throw new ApiException(HttpStatus.UNAUTHORIZED, BAD_LOGIN);
        }
        if (u.getLockedUntil() != null && u.getLockedUntil().isAfter(Instant.now()))
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in 15 minutes.");

        boolean ok = u.isEnabled()
            && encoder.matches(r.password(), u.getPasswordHash())
            && u.getRole().name().equalsIgnoreCase(r.role().trim());
        if (!ok) {
            u.setFailedAttempts(u.getFailedAttempts() + 1);
            if (u.getFailedAttempts() >= MAX_ATTEMPTS) {
                u.setLockedUntil(Instant.now().plus(LOCK_TIME));
                u.setFailedAttempts(0);
            }
            users.save(u);
            throw new ApiException(HttpStatus.UNAUTHORIZED, BAD_LOGIN);
        }
        if (u.getFailedAttempts() > 0 || u.getLockedUntil() != null) {
            u.setFailedAttempts(0); u.setLockedUntil(null); users.save(u);
        }
        return new AuthResponse(jwt.generate(u), "Bearer", jwt.getExpirySeconds(),
            u.getUsername(), u.getFullName(), label(u.getRole()));
    }

    /** Always succeeds from the caller's view, so nobody can probe which emails are registered. */
    @Transactional
    public void forgotPassword(String emailInput) {
        users.findByEmailIgnoreCase(emailInput.trim()).filter(User::isEnabled).ifPresent(u -> {
            tokens.deleteByUser(u);   // only the newest link works
            String raw = randomToken();
            PasswordResetToken t = new PasswordResetToken();
            t.setUser(u);
            t.setTokenHash(sha256(raw));
            t.setExpiresAt(Instant.now().plus(RESET_TTL));
            tokens.save(t);
            email.sendPasswordReset(u.getEmail(), u.getFullName(), frontendUrl + "/reset-password?token=" + raw);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest r) {
        PasswordResetToken t = tokens.findByTokenHash(sha256(r.token().trim()))
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, BAD_RESET));
        if (t.isUsed() || t.getExpiresAt().isBefore(Instant.now()))
            throw new ApiException(HttpStatus.BAD_REQUEST, BAD_RESET);
        User u = t.getUser();
        u.setPasswordHash(encoder.encode(r.newPassword()));
        u.setFailedAttempts(0);
        u.setLockedUntil(null);
        t.setUsed(true);   // single use; both changes are saved when the transaction ends
    }

    public UserResponse me(String username) {
        User u = users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getPhone(), label(u.getRole()));
    }

    private static String label(Role r) { return r.name().charAt(0) + r.name().substring(1).toLowerCase(); }

    private static String randomToken() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
