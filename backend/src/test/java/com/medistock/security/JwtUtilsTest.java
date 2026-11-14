package com.medistock.security;

import com.medistock.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtUtils, "accessTokenExpirationMs", 3600000L);
        ReflectionTestUtils.setField(jwtUtils, "refreshTokenExpirationMs", 86400000L);
    }

    @Test
    @DisplayName("Should generate valid JWT token with subject and claims")
    void testTokenGenerationAndValidation() {
        String token = jwtUtils.generateAccessToken("doctor@medistock.com", Role.PHARMACIST, 42L);

        assertNotNull(token);
        assertTrue(jwtUtils.validateToken(token));
        assertEquals("doctor@medistock.com", jwtUtils.getEmailFromToken(token));
        assertEquals(Role.PHARMACIST.name(), jwtUtils.getRoleFromToken(token));
    }

    @Test
    @DisplayName("Should reject malformed JWT token")
    void testInvalidTokenRejection() {
        assertFalse(jwtUtils.validateToken("invalid.jwt.token"));
    }
}
