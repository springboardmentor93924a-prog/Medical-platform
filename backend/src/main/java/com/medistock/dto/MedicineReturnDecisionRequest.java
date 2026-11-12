
package com.medistock.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MedicineReturnDecisionRequest {

    @NotBlank(message = "Decision is required")
    private String decision;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
