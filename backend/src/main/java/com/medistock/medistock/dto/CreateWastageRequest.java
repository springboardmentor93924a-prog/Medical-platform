package com.medistock.medistock.dto;

public class CreateWastageRequest {

    private Integer medicineId;
    private Integer batchId;
    private Integer quantity;
    private String reason; // EXPIRED, DAMAGED, COLD_CHAIN_FAILURE, CONTAMINATED, DEFECTIVE_PACKAGING, MISSING_STOCK
    private String notes;
    private String evidencePhotoUrl;

    public CreateWastageRequest() {}

    public Integer getMedicineId() { return medicineId; }
    public void setMedicineId(Integer medicineId) { this.medicineId = medicineId; }

    public Integer getBatchId() { return batchId; }
    public void setBatchId(Integer batchId) { this.batchId = batchId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getEvidencePhotoUrl() { return evidencePhotoUrl; }
    public void setEvidencePhotoUrl(String evidencePhotoUrl) { this.evidencePhotoUrl = evidencePhotoUrl; }
}

