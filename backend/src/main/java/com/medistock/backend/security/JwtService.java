package com.medistock.backend.security;

import com.medistock.backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirySeconds;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiry-minutes}") long minutes) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));   // fails at startup if under 256 bits
        this.expirySeconds = minutes * 60;
    }

    public String generate(User u) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(u.getUsername())
            .claim("role", u.getRole().name())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expirySeconds)))
            .signWith(key)
            .compact();
    }

    /** Throws JwtException if the token is tampered with or expired. */
    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public long getExpirySeconds() { return expirySeconds; }
}
