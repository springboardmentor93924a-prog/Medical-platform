package com.medistock.medistock_backend.security;

/**
 * Fixed security-related constants. Keeping them here avoids magic strings
 * scattered across the security package.
 */
public final class SecurityConstants {

    private SecurityConstants() {}

    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_NAME  = "Authorization";
    public static final String ROLE_PREFIX  = "ROLE_";
}