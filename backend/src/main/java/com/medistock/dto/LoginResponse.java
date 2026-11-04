package com.medistock.dto;

public class LoginResponse {

    private String token;
    private String tokenType;
    private long expiresIn;
    private String role;
    private String profilePicture;
    private String fullName;

    public LoginResponse(
            String token,
            String tokenType,
            long expiresIn,
            String role,
            String profilePicture,
            String fullName) {

        this.token = token;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.role = role;
        this.profilePicture = profilePicture;
        this.fullName = fullName;
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

    public String getProfilePicture() {
        return profilePicture;
    }

    public String getFullName() {
        return fullName;
    }
}