package com.medistock.dto.request;

import jakarta.validation.constraints.NotBlank;

public class WastageReviewRequest {

    @NotBlank(message = "Action (APPROVE or REJECT) is required")
    private String action;

    private String reviewNotes;

    public WastageReviewRequest() {
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }
}
