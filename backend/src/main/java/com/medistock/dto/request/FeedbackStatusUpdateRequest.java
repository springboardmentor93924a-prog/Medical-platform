package com.medistock.dto.request;

import com.medistock.enums.FeedbackStatus;
import jakarta.validation.constraints.NotNull;

public class FeedbackStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private FeedbackStatus status;

    private String adminResponse;

    public FeedbackStatusUpdateRequest() {
    }

    public FeedbackStatus getStatus() {
        return status;
    }

    public void setStatus(FeedbackStatus status) {
        this.status = status;
    }

    public String getAdminResponse() {
        return adminResponse;
    }

    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
    }
}
