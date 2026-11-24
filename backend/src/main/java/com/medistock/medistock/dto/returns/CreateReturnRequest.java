package com.medistock.medistock.dto.returns;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateReturnRequest {

    @NotNull(message = "Batch ID is required")
    private Integer batchId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotBlank(message = "Return source is required")
    private String returnSource; // DEPARTMENT_RETURN, PATIENT_RETURN, SUPPLIER_RETURN, INTERNAL_RECALL

    @NotBlank(message = "Return reason is required")
    private String returnReason; // DAMAGED_PACKAGING, SUSPECTED_CONTAMINATION, NEAR_EXPIRY_RECALL, OVERSTOCK_SURPLUS, PATIENT_DISCONTINUED, WRONG_DISPENSE

    private String reasonDetails;
    private String department;

    public CreateReturnRequest() {}

    public Integer getBatchId() {
        return batchId;
    }

    public void setBatchId(Integer batchId) {
        this.batchId = batchId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getReturnSource() {
        return returnSource;
    }

    public void setReturnSource(String returnSource) {
        this.returnSource = returnSource;
    }

    public String getReturnReason() {
        return returnReason;
    }

    public void setReturnReason(String returnReason) {
        this.returnReason = returnReason;
    }

    public String getReasonDetails() {
        return reasonDetails;
    }

    public void setReasonDetails(String reasonDetails) {
        this.reasonDetails = reasonDetails;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}

