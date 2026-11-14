package com.medistock.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PurchaseOrderItemRequest {
    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    @NotNull(message = "Requested quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer requestedQuantity;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Unit price must be greater than zero")
    private BigDecimal unitPrice;

    public PurchaseOrderItemRequest() {
    }

    public PurchaseOrderItemRequest(Long medicineId, Integer requestedQuantity, BigDecimal unitPrice) {
        this.medicineId = medicineId;
        this.requestedQuantity = requestedQuantity;
        this.unitPrice = unitPrice;
    }

    public Long getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Long medicineId) {
        this.medicineId = medicineId;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}
