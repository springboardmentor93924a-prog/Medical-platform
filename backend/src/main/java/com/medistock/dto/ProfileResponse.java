
package com.medistock.dto;

public class ProfileResponse {

    private String fullName;
    private String email;
    private String phone;

    public ProfileResponse() {
    }

    public ProfileResponse(
            String fullName,
            String email,
            String phone) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
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
}
