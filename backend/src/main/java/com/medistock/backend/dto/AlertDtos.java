package com.medistock.backend.dto;

public final class AlertDtos {
    private AlertDtos() {}

    /**
     * type: Out of stock, Low stock, Near expiry or Expired
     * severity: critical or warning
     * category: Stock or Expiry
     * batchId is set for expiry alerts only
     */
    public record AlertResponse(String id, String type, String severity, String category,
                                String title, String detail, Long medicineId, Long batchId, int quantity) {}
}
