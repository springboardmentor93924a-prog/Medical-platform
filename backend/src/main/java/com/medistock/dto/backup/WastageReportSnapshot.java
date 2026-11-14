package com.medistock.dto.backup;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class WastageReportSnapshot {
    private Long id;
    private String medicineName;
    private String batchNumber;
    private Integer quantityWasted;
    private String wastageReason;
    private LocalDate reportDate;
    private String reportedByEmail;
    private String status;
    private String reviewNotes;
    private LocalDateTime createdAt;

    public WastageReportSnapshot() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Integer getQuantityWasted() { return quantityWasted; }
    public void setQuantityWasted(Integer quantityWasted) { this.quantityWasted = quantityWasted; }

    public String getWastageReason() { return wastageReason; }
    public void setWastageReason(String wastageReason) { this.wastageReason = wastageReason; }

    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }

    public String getReportedByEmail() { return reportedByEmail; }
    public void setReportedByEmail(String reportedByEmail) { this.reportedByEmail = reportedByEmail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
