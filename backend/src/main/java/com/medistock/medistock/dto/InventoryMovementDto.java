package com.medistock.medistock.dto;

import java.time.LocalDateTime;

public class InventoryMovementDto {
    private final Integer stockLogId;
    private final LocalDateTime timestamp;
    private final Integer medicineId;
    private final String medicineName;
    private final String batchNumber;
    private final String actionType;
    private final Integer quantityChanged;
    private final String actionedBy;

    public InventoryMovementDto(
            Integer stockLogId,
            LocalDateTime timestamp,
            Integer medicineId,
            String medicineName,
            String batchNumber,
            String actionType,
            Integer quantityChanged,
            String actionedBy) {
        this.stockLogId = stockLogId;
        this.timestamp = timestamp;
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.batchNumber = batchNumber;
        this.actionType = actionType;
        this.quantityChanged = quantityChanged;
        this.actionedBy = actionedBy;
    }

    public Integer getStockLogId() { return stockLogId; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public Integer getMedicineId() { return medicineId; }
    public String getMedicineName() { return medicineName; }
    public String getBatchNumber() { return batchNumber; }
    public String getActionType() { return actionType; }
    public Integer getQuantityChanged() { return quantityChanged; }
    public String getActionedBy() { return actionedBy; }
}
