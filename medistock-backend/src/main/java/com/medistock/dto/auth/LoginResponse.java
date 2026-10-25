
package com.medistock.dto.auth;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        String role
) {
}
