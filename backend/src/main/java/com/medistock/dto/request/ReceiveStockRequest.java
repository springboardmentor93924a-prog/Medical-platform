package com.medistock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ReceiveStockRequest {

    public static class ReceiveItemDto {
        @NotNull(message = "Item ID is required")
        private Long itemId;

        @NotNull(message = "Received quantity is required")
        @Min(value = 0, message = "Received quantity cannot be negative")
        private Integer receivedQuantity;

        public ReceiveItemDto() {
        }

        public ReceiveItemDto(Long itemId, Integer receivedQuantity) {
            this.itemId = itemId;
            this.receivedQuantity = receivedQuantity;
        }

        public Long getItemId() {
            return itemId;
        }

        public void setItemId(Long itemId) {
            this.itemId = itemId;
        }

        public Integer getReceivedQuantity() {
            return receivedQuantity;
        }

        public void setReceivedQuantity(Integer receivedQuantity) {
            this.receivedQuantity = receivedQuantity;
        }
    }

    @NotEmpty(message = "Items list cannot be empty")
    private List<ReceiveItemDto> items;

    private String notes;

    public ReceiveStockRequest() {
    }

    public List<ReceiveItemDto> getItems() {
        return items;
    }

    public void setItems(List<ReceiveItemDto> items) {
        this.items = items;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
