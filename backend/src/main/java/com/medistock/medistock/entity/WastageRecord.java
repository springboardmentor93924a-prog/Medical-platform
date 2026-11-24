package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wastage_records")
public class WastageRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wastage_id")
    private Integer wastageId;

    @Column(name = "medicine_id", nullable = false)
    private Integer medicineId;

    @Column(name = "medicine_name", nullable = false, length = 150)
    private String medicineName;

    @Column(name = "batch_id", nullable = false)
    private Integer batchId;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @Column(name = "supplier_id")
    private Integer supplierId;

    @Column(name = "supplier_name", length = 150)
    private String supplierName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "total_loss", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalLoss = BigDecimal.ZERO;

    @Column(name = "supplier_recovery", nullable = false, precision = 12, scale = 2)
    private BigDecimal supplierRecovery = BigDecimal.ZERO;

    @Column(name = "net_financial_loss", nullable = false, precision = 12, scale = 2)
    private BigDecimal netFinancialLoss = BigDecimal.ZERO;

    @Column(name = "reason", nullable = false, length = 100)
    private String reason; // EXPIRED, DAMAGED, COLD_CHAIN_FAILURE, CONTAMINATED, DEFECTIVE_PACKAGING, MISSING_STOCK

    @Column(name = "status", nullable = false, length = 30)
    private String status = "SUBMITTED"; // SUBMITTED, VERIFIED, PENDING_APPROVAL, APPROVED, REJECTED, WRITTEN_OFF

    @Column(name = "reported_by_id")
    private Integer reportedById;

    @Column(name = "reported_by_name", length = 100)
    private String reportedByName;

    @Column(name = "reported_by_role", length = 50)
    private String reportedByRole;

    @Column(name = "verified_by_id")
    private Integer verifiedById;

    @Column(name = "verified_by_name", length = 100)
    private String verifiedByName;

    @Column(name = "verification_remarks", columnDefinition = "TEXT")
    private String verificationRemarks;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "approved_by_id")
    private Integer approvedById;

    @Column(name = "approved_by_name", length = 100)
    private String approvedByName;

    @Column(name = "approval_remarks", columnDefinition = "TEXT")
    private String approvalRemarks;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "evidence_photo_url", columnDefinition = "TEXT")
    private String evidencePhotoUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public WastageRecord() {}

    public Integer getWastageId() { return wastageId; }
    public void setWastageId(Integer wastageId) { this.wastageId = wastageId; }

    public Integer getMedicineId() { return medicineId; }
    public void setMedicineId(Integer medicineId) { this.medicineId = medicineId; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public Integer getBatchId() { return batchId; }
    public void setBatchId(Integer batchId) { this.batchId = batchId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Integer getSupplierId() { return supplierId; }
    public void setSupplierId(Integer supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public BigDecimal getTotalLoss() { return totalLoss; }
    public void setTotalLoss(BigDecimal totalLoss) { this.totalLoss = totalLoss; }

    public BigDecimal getSupplierRecovery() { return supplierRecovery; }
    public void setSupplierRecovery(BigDecimal supplierRecovery) { this.supplierRecovery = supplierRecovery; }

    public BigDecimal getNetFinancialLoss() { return netFinancialLoss; }
    public void setNetFinancialLoss(BigDecimal netFinancialLoss) { this.netFinancialLoss = netFinancialLoss; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getReportedById() { return reportedById; }
    public void setReportedById(Integer reportedById) { this.reportedById = reportedById; }

    public String getReportedByName() { return reportedByName; }
    public void setReportedByName(String reportedByName) { this.reportedByName = reportedByName; }

    public String getReportedByRole() { return reportedByRole; }
    public void setReportedByRole(String reportedByRole) { this.reportedByRole = reportedByRole; }

    public Integer getVerifiedById() { return verifiedById; }
    public void setVerifiedById(Integer verifiedById) { this.verifiedById = verifiedById; }

    public String getVerifiedByName() { return verifiedByName; }
    public void setVerifiedByName(String verifiedByName) { this.verifiedByName = verifiedByName; }

    public String getVerificationRemarks() { return verificationRemarks; }
    public void setVerificationRemarks(String verificationRemarks) { this.verificationRemarks = verificationRemarks; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public Integer getApprovedById() { return approvedById; }
    public void setApprovedById(Integer approvedById) { this.approvedById = approvedById; }

    public String getApprovedByName() { return approvedByName; }
    public void setApprovedByName(String approvedByName) { this.approvedByName = approvedByName; }

    public String getApprovalRemarks() { return approvalRemarks; }
    public void setApprovalRemarks(String approvalRemarks) { this.approvalRemarks = approvalRemarks; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public String getEvidencePhotoUrl() { return evidencePhotoUrl; }
    public void setEvidencePhotoUrl(String evidencePhotoUrl) { this.evidencePhotoUrl = evidencePhotoUrl; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

