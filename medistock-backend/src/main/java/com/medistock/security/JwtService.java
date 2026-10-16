
package com.medistock.security;

import java.time.Instant;
import java.util.Base64;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final long expirationMs;
    public long getExpirationSeconds() {
    return expirationMs / 1000;
}

    public JwtService(
            @Value("${app.jwt.secret}") String base64Secret,
            @Value("${app.jwt.expiration-ms:3600000}") long expirationMs) {

        byte[] keyBytes = Base64.getDecoder().decode(base64Secret);

        if (keyBytes.length < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must contain at least 32 bytes.");
        }

        SecretKey secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");

        this.jwtEncoder = new NimbusJwtEncoder(
                new ImmutableSecret<>(secretKey));

        this.jwtDecoder = NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

        this.expirationMs = expirationMs;
    }

    public String generateToken(
            String email,
            List<String> authorities) {

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("medistock")
                .subject(email)
                .issuedAt(now)
                .expiresAt(now.plusMillis(expirationMs))
                .claim("roles", authorities)
                .build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(
                        org.springframework.security.oauth2.jwt
                                .JwsHeader.with(MacAlgorithm.HS256)
                                .build(),
                        claims))
                .getTokenValue();
    }

    public JwtDecoder getJwtDecoder() {
        return jwtDecoder;
    }
}
