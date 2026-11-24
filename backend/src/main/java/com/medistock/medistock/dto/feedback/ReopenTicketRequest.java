package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotBlank;

public class ReopenTicketRequest {

    @NotBlank(message = "Reason for reopening the ticket is required")
    private String reopenReason;

    public ReopenTicketRequest() {
    }

    public ReopenTicketRequest(String reopenReason) {
        this.reopenReason = reopenReason;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }
}

