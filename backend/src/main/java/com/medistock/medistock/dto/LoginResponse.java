package com.medistock.medistock.dto;

public class LoginResponse {

    private String token;
    private String type = "Bearer";
    private Integer userId;
    private String fullName;
    private String email;
    private String role;

    public LoginResponse() {
    }

    public LoginResponse(String token, Integer userId, String fullName, String email, String role) {
        this.token = token;
        this.type = "Bearer";
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
