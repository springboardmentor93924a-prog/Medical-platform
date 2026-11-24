package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_discrepancies")
public class StockDiscrepancy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discrepancy_id")
    private Integer discrepancyId;

    @Column(name = "batch_id")
    private Integer batchId;

    @Column(name = "medicine_id", nullable = false)
    private Integer medicineId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", insertable = false, updatable = false)
    private Medicine medicine;

    @Column(name = "expected_quantity", nullable = false)
    private Integer expectedQuantity;

    @Column(name = "counted_quantity", nullable = false)
    private Integer countedQuantity;

    @Column(name = "discrepancy", nullable = false)
    private Integer discrepancy;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "reported_by", nullable = false)
    private Integer reportedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reported_by", insertable = false, updatable = false)
    private User reporter;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, RESOLVED, REJECTED

    @Column(name = "resolved_by")
    private Integer resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "adjustment_id")
    private Integer adjustmentId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public StockDiscrepancy() {}

    public Integer getDiscrepancyId() { return discrepancyId; }
    public void setDiscrepancyId(Integer discrepancyId) { this.discrepancyId = discrepancyId; }

    public Integer getBatchId() { return batchId; }
    public void setBatchId(Integer batchId) { this.batchId = batchId; }

    public Integer getMedicineId() { return medicineId; }
    public void setMedicineId(Integer medicineId) { this.medicineId = medicineId; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

    public Integer getExpectedQuantity() { return expectedQuantity; }
    public void setExpectedQuantity(Integer expectedQuantity) { this.expectedQuantity = expectedQuantity; }

    public Integer getCountedQuantity() { return countedQuantity; }
    public void setCountedQuantity(Integer countedQuantity) { this.countedQuantity = countedQuantity; }

    public Integer getDiscrepancy() { return discrepancy; }
    public void setDiscrepancy(Integer discrepancy) { this.discrepancy = discrepancy; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Integer getReportedBy() { return reportedBy; }
    public void setReportedBy(Integer reportedBy) { this.reportedBy = reportedBy; }

    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(Integer resolvedBy) { this.resolvedBy = resolvedBy; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public Integer getAdjustmentId() { return adjustmentId; }
    public void setAdjustmentId(Integer adjustmentId) { this.adjustmentId = adjustmentId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}

