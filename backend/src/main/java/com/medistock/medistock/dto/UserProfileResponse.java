package com.medistock.medistock.dto;

public class UserProfileResponse {

    private Integer userId;
    private String fullName;
    private String email;
    private String username;
    private String role;

    private String phone;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Integer userId, String fullName, String email, String username, String role) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.username = username;
        this.role = role;
    }

    public UserProfileResponse(Integer userId, String fullName, String email, String username, String role, String phone) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.username = username;
        this.role = role;
        this.phone = phone;
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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
