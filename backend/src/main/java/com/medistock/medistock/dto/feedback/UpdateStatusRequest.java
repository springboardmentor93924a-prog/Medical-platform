package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotBlank;

public class UpdateStatusRequest {

    @NotBlank(message = "New status is required")
    private String status;

    private String reason;

    public UpdateStatusRequest() {
    }

    public UpdateStatusRequest(String status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

