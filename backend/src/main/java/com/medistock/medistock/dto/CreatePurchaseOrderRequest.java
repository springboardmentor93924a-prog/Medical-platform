package com.medistock.medistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreatePurchaseOrderRequest {
    private Integer supplierId;
    private LocalDate expectedDeliveryDate;
    private String notes;
    private Boolean saveDraft;
    private List<OrderItemDto> items;

    public static class OrderItemDto {
        private Integer medicineId;
        private Integer quantity;
        private BigDecimal unitCost;

        public OrderItemDto() {
        }

        public Integer getMedicineId() {
            return medicineId;
        }

        public void setMedicineId(Integer medicineId) {
            this.medicineId = medicineId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getUnitCost() {
            return unitCost;
        }

        public void setUnitCost(BigDecimal unitCost) {
            this.unitCost = unitCost;
        }
    }

    public CreatePurchaseOrderRequest() {
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getSaveDraft() {
        return saveDraft;
    }

    public void setSaveDraft(Boolean saveDraft) {
        this.saveDraft = saveDraft;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }
}
