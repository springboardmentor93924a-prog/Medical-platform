
package com.medistock.dto;

public class AdminUserResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private Boolean active;

    public AdminUserResponse(
            Long userId,
            String fullName,
            String email,
            String role,
            Boolean active) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.active = active;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public Boolean getActive() {
        return active;
    }
}
