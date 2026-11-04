
package com.medistock.dto;

import java.time.LocalDate;
import java.util.List;

public class ReceivePurchaseOrderRequest {

    private List<ReceiptItem> items;

    public List<ReceiptItem> getItems() {
        return items;
    }

    public void setItems(List<ReceiptItem> items) {
        this.items = items;
    }

    public static class ReceiptItem {

        private Long itemId;
        private Integer receivedQuantity;
        private String batchNumber;
        private LocalDate manufacturingDate;
        private LocalDate expiryDate;

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

        public String getBatchNumber() {
            return batchNumber;
        }

        public void setBatchNumber(String batchNumber) {
            this.batchNumber = batchNumber;
        }

        public LocalDate getManufacturingDate() {
            return manufacturingDate;
        }

        public void setManufacturingDate(LocalDate manufacturingDate) {
            this.manufacturingDate = manufacturingDate;
        }

        public LocalDate getExpiryDate() {
            return expiryDate;
        }

        public void setExpiryDate(LocalDate expiryDate) {
            this.expiryDate = expiryDate;
        }
    }
}
