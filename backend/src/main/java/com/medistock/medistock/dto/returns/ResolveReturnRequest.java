package com.medistock.medistock.dto.returns;

import jakarta.validation.constraints.NotBlank;

public class ResolveReturnRequest {

    @NotBlank(message = "Resolution action is required")
    private String resolutionAction; // RESTOCK_USABLE_INVENTORY, DISPOSE_TO_WASTAGE, DISPATCH_TO_SUPPLIER_CREDIT, REJECT_RETURN

    private String notes;

    public ResolveReturnRequest() {}

    public String getResolutionAction() {
        return resolutionAction;
    }

    public void setResolutionAction(String resolutionAction) {
        this.resolutionAction = resolutionAction;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

