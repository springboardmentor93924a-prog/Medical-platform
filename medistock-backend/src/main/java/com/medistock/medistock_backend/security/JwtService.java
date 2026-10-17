package com.medistock.medistock_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

/**
 * Encapsulates all JWT operations: signing, parsing, and validating tokens.
 * Depends on `app.jwt.secret` and `app.jwt.expiration-ms` from configuration.
 */
@Service
public class JwtService {

    private final String secret;
    private final long expirationMs;

    private SecretKey signingKey;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    @PostConstruct
    void init() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret is missing. Set the JWT_SECRET environment variable.");
        }
        // HMAC-SHA256 requires at least 256 bits (32 bytes). We enforce that here
        // so weak secrets fail at startup, not at first login attempt.
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT secret too short. Use at least 32 bytes (openssl rand -base64 64).");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /** Build a signed JWT for the given user. */
    public String generateToken(String subjectEmail, Map<String, Object> extraClaims) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(extraClaims)
                .subject(subjectEmail)
                .issuedAt(now)
                .expiration(exp)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Extract email (subject) from token. */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /** Extract a specific claim from the token. */
    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = parseAllClaims(token);
        return resolver.apply(claims);
    }

    /** True if the token is valid for the given email and not expired. */
    public boolean isTokenValid(String token, String expectedEmail) {
        try {
            String email = extractEmail(token);
            return email.equalsIgnoreCase(expectedEmail) && !isExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private Claims parseAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}