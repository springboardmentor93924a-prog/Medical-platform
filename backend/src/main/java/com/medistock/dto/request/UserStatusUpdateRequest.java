package com.medistock.dto.request;

import com.medistock.enums.Role;
import com.medistock.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public class UserStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private UserStatus status;

    private Role role;

    public UserStatusUpdateRequest() {
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
