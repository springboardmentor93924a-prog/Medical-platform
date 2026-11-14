package com.medistock.dto.request;

import com.medistock.enums.WastageReason;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class WastageRequest {

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    @NotNull(message = "Quantity wasted is required")
    @Min(value = 1, message = "Quantity wasted must be at least 1")
    private Integer quantityWasted;

    @NotNull(message = "Wastage reason is required")
    private WastageReason reason;

    private String description;

    public WastageRequest() {
    }

    public Long getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Long medicineId) {
        this.medicineId = medicineId;
    }

    public Integer getQuantityWasted() {
        return quantityWasted;
    }

    public void setQuantityWasted(Integer quantityWasted) {
        this.quantityWasted = quantityWasted;
    }

    public WastageReason getReason() {
        return reason;
    }

    public void setReason(WastageReason reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
