package com.medistock.medistock_backend.util;

/**
 * Central definition of role names used across the application.
 * Using constants prevents typos and keeps the values in one place.
 */
public final class RoleConstants {

    private RoleConstants() {
        // utility class — prevent instantiation
    }

    public static final String ADMIN       = "ADMIN";
    public static final String PHARMACIST  = "PHARMACIST";
    public static final String STAFF       = "STAFF";
    public static final String SUPPLIER    = "SUPPLIER";
}