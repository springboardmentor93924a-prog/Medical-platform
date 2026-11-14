package com.medistock.dto.request;

import com.medistock.enums.MovementType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class StockMovementRequest {
    @NotNull(message = "Medicine is required")
    private Long medicineId;

    @NotNull(message = "Movement type is required")
    private MovementType movementType;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String reason;
    private String referenceNumber;

    public StockMovementRequest() {
    }

    public StockMovementRequest(Long medicineId, MovementType movementType, Integer quantity, String reason, String referenceNumber) {
        this.medicineId = medicineId;
        this.movementType = movementType;
        this.quantity = quantity;
        this.reason = reason;
        this.referenceNumber = referenceNumber;
    }

    public Long getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Long medicineId) {
        this.medicineId = medicineId;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public void setMovementType(MovementType movementType) {
        this.movementType = movementType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }
}
