package com.medistock.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminSetupRequest {
    @NotBlank(message = "Setup key is required")
    private String setupKey;

    @NotBlank(message = "Admin full name is required")
    private String fullName;

    @NotBlank(message = "Admin email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    public AdminSetupRequest() {
    }

    public String getSetupKey() {
        return setupKey;
    }

    public void setSetupKey(String setupKey) {
        this.setupKey = setupKey;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
