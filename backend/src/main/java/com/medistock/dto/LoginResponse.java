
package com.medistock.dto;

public class LoginResponse {

    private String token;
    private String tokenType;
    private long expiresIn;
    private String role;

    public LoginResponse(String token, String tokenType, long expiresIn, String role) {
        this.token = token;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public String getRole() {
        return role;
    }
}
