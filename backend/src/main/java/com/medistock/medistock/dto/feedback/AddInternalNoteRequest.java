package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotBlank;

public class AddInternalNoteRequest {

    @NotBlank(message = "Internal note cannot be empty")
    private String note;

    public AddInternalNoteRequest() {
    }

    public AddInternalNoteRequest(String note) {
        this.note = note;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}

