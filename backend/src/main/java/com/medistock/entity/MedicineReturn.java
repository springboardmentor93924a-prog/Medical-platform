
package com.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_returns")
public class MedicineReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_id")
    private Long returnId;

    @Column(name = "return_type", nullable = false, length = 30)
    private String returnType;

    @Column(name = "inventory_id", nullable = false)
    private Long inventoryId;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "customer_contact", length = 30)
    private String customerContact;

    @Column(name = "return_quantity", nullable = false)
    private Integer returnQuantity;

    @Column(name = "return_reason", nullable = false, length = 500)
    private String returnReason;

    @Column(name = "medicine_condition", nullable = false, length = 30)
    private String medicineCondition;

    @Column(name = "restock_eligible", nullable = false)
    private Boolean restockEligible = false;

    @Column(name = "return_status", nullable = false, length = 20)
    private String returnStatus = "PENDING";

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "return_date", nullable = false)
    private LocalDate returnDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "notes", length = 500)
    private String notes;

    public MedicineReturn() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (returnDate == null) {
            returnDate = LocalDate.now();
        }
        if (returnStatus == null) {
            returnStatus = "PENDING";
        }
    }

    public Long getReturnId() { return returnId; }
    public void setReturnId(Long returnId) { this.returnId = returnId; }

    public String getReturnType() { return returnType; }
    public void setReturnType(String returnType) { this.returnType = returnType; }

    public Long getInventoryId() { return inventoryId; }
    public void setInventoryId(Long inventoryId) { this.inventoryId = inventoryId; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerContact() { return customerContact; }
    public void setCustomerContact(String customerContact) { this.customerContact = customerContact; }

    public Integer getReturnQuantity() { return returnQuantity; }
    public void setReturnQuantity(Integer returnQuantity) { this.returnQuantity = returnQuantity; }

    public String getReturnReason() { return returnReason; }
    public void setReturnReason(String returnReason) { this.returnReason = returnReason; }

    public String getMedicineCondition() { return medicineCondition; }
    public void setMedicineCondition(String medicineCondition) { this.medicineCondition = medicineCondition; }

    public Boolean getRestockEligible() { return restockEligible; }
    public void setRestockEligible(Boolean restockEligible) { this.restockEligible = restockEligible; }

    public String getReturnStatus() { return returnStatus; }
    public void setReturnStatus(String returnStatus) { this.returnStatus = returnStatus; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public Long getProcessedBy() { return processedBy; }
    public void setProcessedBy(Long processedBy) { this.processedBy = processedBy; }

    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
