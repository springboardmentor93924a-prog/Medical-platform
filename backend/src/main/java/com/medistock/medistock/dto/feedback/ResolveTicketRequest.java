package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotBlank;

public class ResolveTicketRequest {

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;

    public ResolveTicketRequest() {
    }

    public ResolveTicketRequest(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }
}

