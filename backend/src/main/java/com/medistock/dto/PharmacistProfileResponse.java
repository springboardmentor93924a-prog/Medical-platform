package com.medistock.dto;

public class PharmacistProfileResponse {

    private final String fullName;
    private final String email;
    private final String phone;
    private final String token;

    public PharmacistProfileResponse(
            String fullName, String email, String phone, String token) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.token = token;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getToken() {
        return token;
    }
}
