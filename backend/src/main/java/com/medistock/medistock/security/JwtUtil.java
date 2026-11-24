package com.medistock.medistock.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${medistock.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    @Value("${medistock.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email, Integer userId, String role, String fullName) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .claim("fullName", fullName)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getEmailFromToken(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public Integer getUserIdFromToken(String token) {
        return extractAllClaims(token).get("userId", Integer.class);
    }

    public String getFullNameFromToken(String token) {
        return extractAllClaims(token).get("fullName", String.class);
    }

    public String generatePasswordResetToken(String email) {
        Date now = new Date();
        // 15 minutes expiration for password reset
        Date expiryDate = new Date(now.getTime() + 15 * 60 * 1000);

        return Jwts.builder()
                .subject(email)
                .claim("type", "RESET_PASSWORD")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isPasswordResetToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "RESET_PASSWORD".equalsIgnoreCase(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
