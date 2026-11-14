package com.medistock.dto.request;

import com.medistock.enums.SupplierStatus;
import jakarta.validation.constraints.NotNull;

public class SupplierStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private SupplierStatus status;

    private String notes;

    public SupplierStatusUpdateRequest() {
    }

    public SupplierStatus getStatus() {
        return status;
    }

    public void setStatus(SupplierStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setReason(String reason) {
        if (this.notes == null || this.notes.isBlank()) {
            this.notes = reason;
        }
    }
}
