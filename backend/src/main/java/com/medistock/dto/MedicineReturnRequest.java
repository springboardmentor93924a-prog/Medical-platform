
package com.medistock.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class MedicineReturnRequest {

    @NotBlank(message = "Return type is required")
    private String returnType;

    @NotNull(message = "Inventory batch is required")
    private Long inventoryId;

    private Long supplierId;

    @Size(max = 150, message = "Customer name cannot exceed 150 characters")
    private String customerName;

    @Size(max = 30, message = "Customer contact cannot exceed 30 characters")
    private String customerContact;

    @NotNull(message = "Return quantity is required")
    @Min(value = 1, message = "Return quantity must be at least 1")
    private Integer returnQuantity;

    @NotBlank(message = "Return reason is required")
    @Size(max = 500)
    private String returnReason;

    @NotBlank(message = "Medicine condition is required")
    private String medicineCondition;

    @Size(max = 500)
    private String notes;

    public String getReturnType() {
        return returnType;
    }

    public void setReturnType(String returnType) {
        this.returnType = returnType;
    }

    public Long getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Long inventoryId) {
        this.inventoryId = inventoryId;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerContact() {
        return customerContact;
    }

    public void setCustomerContact(String customerContact) {
        this.customerContact = customerContact;
    }

    public Integer getReturnQuantity() {
        return returnQuantity;
    }

    public void setReturnQuantity(Integer returnQuantity) {
        this.returnQuantity = returnQuantity;
    }

    public String getReturnReason() {
        return returnReason;
    }

    public void setReturnReason(String returnReason) {
        this.returnReason = returnReason;
    }

    public String getMedicineCondition() {
        return medicineCondition;
    }

    public void setMedicineCondition(String medicineCondition) {
        this.medicineCondition = medicineCondition;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
