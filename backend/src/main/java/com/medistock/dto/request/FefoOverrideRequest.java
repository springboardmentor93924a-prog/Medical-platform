package com.medistock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FefoOverrideRequest {

    @NotNull(message = "Requested medicine ID is required")
    private Long requestedMedicineId;

    @NotNull(message = "Recommended earlier-expiring medicine ID is required")
    private Long recommendedMedicineId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotBlank(message = "Clinical or operational override reason is required")
    private String overrideReason;

    public FefoOverrideRequest() {
    }

    public Long getRequestedMedicineId() {
        return requestedMedicineId;
    }

    public void setRequestedMedicineId(Long requestedMedicineId) {
        this.requestedMedicineId = requestedMedicineId;
    }

    public Long getRecommendedMedicineId() {
        return recommendedMedicineId;
    }

    public void setRecommendedMedicineId(Long recommendedMedicineId) {
        this.recommendedMedicineId = recommendedMedicineId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getOverrideReason() {
        return overrideReason;
    }

    public void setOverrideReason(String overrideReason) {
        this.overrideReason = overrideReason;
    }
}
