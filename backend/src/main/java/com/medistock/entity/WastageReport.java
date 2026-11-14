package com.medistock.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medistock.enums.WastageReason;
import com.medistock.enums.WastageStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wastage_reports")
public class WastageReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(name = "batch_number", nullable = false, length = 80)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "quantity_wasted", nullable = false)
    private Integer quantityWasted;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "total_loss", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalLoss = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WastageReason reason = WastageReason.EXPIRED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WastageStatus status = WastageStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reported_by_id", nullable = false)
    private User reportedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public WastageReport() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = WastageStatus.PENDING;
        }
        if (this.totalLoss == null || this.totalLoss.compareTo(BigDecimal.ZERO) == 0) {
            if (this.unitPrice != null && this.quantityWasted != null) {
                this.totalLoss = this.unitPrice.multiply(BigDecimal.valueOf(this.quantityWasted));
            }
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public Integer getQuantityWasted() {
        return quantityWasted;
    }

    public void setQuantityWasted(Integer quantityWasted) {
        this.quantityWasted = quantityWasted;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getTotalLoss() {
        return totalLoss;
    }

    public void setTotalLoss(BigDecimal totalLoss) {
        this.totalLoss = totalLoss;
    }

    public WastageReason getReason() {
        return reason;
    }

    public void setReason(WastageReason reason) {
        this.reason = reason;
    }

    public WastageStatus getStatus() {
        return status;
    }

    public void setStatus(WastageStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }

    public User getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(User reportedBy) {
        this.reportedBy = reportedBy;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    @JsonProperty("medicineName")
    public String getMedicineName() {
        return medicine != null ? medicine.getName() : null;
    }

    @JsonProperty("categoryName")
    public String getCategoryName() {
        if (category != null) return category.getName();
        if (medicine != null && medicine.getCategory() != null) return medicine.getCategory().getName();
        return null;
    }

    @JsonProperty("supplierName")
    public String getSupplierName() {
        if (supplier != null) return supplier.getCompanyName();
        if (medicine != null && medicine.getSupplier() != null) return medicine.getSupplier().getCompanyName();
        return null;
    }

    @JsonProperty("reportedByName")
    public String getReportedByName() {
        return reportedBy != null ? reportedBy.getFullName() : null;
    }

    @JsonProperty("reviewedByName")
    public String getReviewedByName() {
        return reviewedBy != null ? reviewedBy.getFullName() : null;
    }
}
