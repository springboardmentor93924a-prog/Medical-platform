package com.medistock.dto.backup;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PurchaseOrderSnapshot {
    private Long id;
    private String orderNumber;
    private String supplierCompanyName;
    private String createdByEmail;
    private String approvedByEmail;
    private String orderStatus;
    private BigDecimal totalAmount;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private LocalDate actualDeliveryDate;
    private String notes;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private List<PurchaseOrderItemSnapshot> items = new ArrayList<>();

    public PurchaseOrderSnapshot() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getSupplierCompanyName() { return supplierCompanyName; }
    public void setSupplierCompanyName(String supplierCompanyName) { this.supplierCompanyName = supplierCompanyName; }

    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }

    public String getApprovedByEmail() { return approvedByEmail; }
    public void setApprovedByEmail(String approvedByEmail) { this.approvedByEmail = approvedByEmail; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public LocalDate getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }

    public LocalDate getActualDeliveryDate() { return actualDeliveryDate; }
    public void setActualDeliveryDate(LocalDate actualDeliveryDate) { this.actualDeliveryDate = actualDeliveryDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<PurchaseOrderItemSnapshot> getItems() { return items; }
    public void setItems(List<PurchaseOrderItemSnapshot> items) { this.items = items; }
}
