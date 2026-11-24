package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotBlank;

public class UpdatePriorityRequest {

    @NotBlank(message = "New priority is required")
    private String priority;

    private String reason;

    public UpdatePriorityRequest() {
    }

    public UpdatePriorityRequest(String priority, String reason) {
        this.priority = priority;
        this.reason = reason;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

