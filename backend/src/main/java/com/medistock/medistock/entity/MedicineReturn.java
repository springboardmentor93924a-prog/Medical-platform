package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_returns")
public class MedicineReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_id")
    private Integer returnId;

    @Column(name = "return_number", nullable = false, unique = true, length = 50)
    private String returnNumber;

    @Column(name = "return_source", nullable = false, length = 40)
    private String returnSource; // DEPARTMENT_RETURN, PATIENT_RETURN, SUPPLIER_RETURN, INTERNAL_RECALL

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    private InventoryBatch batch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "total_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "return_reason", nullable = false, length = 100)
    private String returnReason;

    @Column(name = "reason_details", columnDefinition = "TEXT")
    private String reasonDetails;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "QUARANTINED";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Column(name = "source_role", nullable = false, length = 30)
    private String sourceRole;

    @Column(name = "department", length = 100)
    private String department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inspected_by")
    private User inspectedBy;

    @Column(name = "inspected_at")
    private LocalDateTime inspectedAt;

    @Column(name = "inspection_notes", columnDefinition = "TEXT")
    private String inspectionNotes;

    @Column(name = "quality_status", length = 40)
    private String qualityStatus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "resolution_action", length = 50)
    private String resolutionAction;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public MedicineReturn() {}

    public Integer getReturnId() {
        return returnId;
    }

    public void setReturnId(Integer returnId) {
        this.returnId = returnId;
    }

    public String getReturnNumber() {
        return returnNumber;
    }

    public void setReturnNumber(String returnNumber) {
        this.returnNumber = returnNumber;
    }

    public String getReturnSource() {
        return returnSource;
    }

    public void setReturnSource(String returnSource) {
        this.returnSource = returnSource;
    }

    public InventoryBatch getBatch() {
        return batch;
    }

    public void setBatch(InventoryBatch batch) {
        this.batch = batch;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
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

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public String getReturnReason() {
        return returnReason;
    }

    public void setReturnReason(String returnReason) {
        this.returnReason = returnReason;
    }

    public String getReasonDetails() {
        return reasonDetails;
    }

    public void setReasonDetails(String reasonDetails) {
        this.reasonDetails = reasonDetails;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public User getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(User requestedBy) {
        this.requestedBy = requestedBy;
    }

    public String getSourceRole() {
        return sourceRole;
    }

    public void setSourceRole(String sourceRole) {
        this.sourceRole = sourceRole;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public User getInspectedBy() {
        return inspectedBy;
    }

    public void setInspectedBy(User inspectedBy) {
        this.inspectedBy = inspectedBy;
    }

    public LocalDateTime getInspectedAt() {
        return inspectedAt;
    }

    public void setInspectedAt(LocalDateTime inspectedAt) {
        this.inspectedAt = inspectedAt;
    }

    public String getInspectionNotes() {
        return inspectionNotes;
    }

    public void setInspectionNotes(String inspectionNotes) {
        this.inspectionNotes = inspectionNotes;
    }

    public String getQualityStatus() {
        return qualityStatus;
    }

    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getResolutionAction() {
        return resolutionAction;
    }

    public void setResolutionAction(String resolutionAction) {
        this.resolutionAction = resolutionAction;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

