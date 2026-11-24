package com.medistock.medistock.dto;

import java.util.List;

public class FefoAllocationRequest {

    private Integer medicineId;
    private Integer requestedQuantity;
    private Integer selectedBatchId; // Optional manual selection
    private List<BatchSplitItem> batchAllocations; // Optional manual split
    private String referenceType = "DISPENSING";
    private String referenceNumber;
    private String overrideReason; // Required if selectedBatch is not the earliest eligible batch
    private String notes;

    public static class BatchSplitItem {
        private Integer batchId;
        private Integer quantity;

        public BatchSplitItem() {}

        public BatchSplitItem(Integer batchId, Integer quantity) {
            this.batchId = batchId;
            this.quantity = quantity;
        }

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
    }

    public FefoAllocationRequest() {}

    public Integer getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Integer medicineId) {
        this.medicineId = medicineId;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }

    public Integer getSelectedBatchId() {
        return selectedBatchId;
    }

    public void setSelectedBatchId(Integer selectedBatchId) {
        this.selectedBatchId = selectedBatchId;
    }

    public List<BatchSplitItem> getBatchAllocations() {
        return batchAllocations;
    }

    public void setBatchAllocations(List<BatchSplitItem> batchAllocations) {
        this.batchAllocations = batchAllocations;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public String getOverrideReason() {
        return overrideReason;
    }

    public void setOverrideReason(String overrideReason) {
        this.overrideReason = overrideReason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

