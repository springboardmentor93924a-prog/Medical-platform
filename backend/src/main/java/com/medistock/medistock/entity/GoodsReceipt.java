package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "goods_receipts")
public class GoodsReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "receipt_id")
    private Integer receiptId;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 50)
    private String receiptNumber;

    @Column(name = "purchase_order_id", nullable = false)
    private Integer purchaseOrderId;

    @Column(name = "received_by", nullable = false)
    private Integer receivedBy;

    @Column(name = "received_at")
    private LocalDateTime receivedAt = LocalDateTime.now();

    @Column(name = "status", nullable = false, length = 30)
    private String status = "COMPLETED";

    @Column(name = "total_items")
    private Integer totalItems = 0;

    @Column(name = "has_discrepancies")
    private Boolean hasDiscrepancies = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "goodsReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoodsReceiptItem> items = new ArrayList<>();

    public GoodsReceipt() {}

    public Integer getReceiptId() { return receiptId; }
    public void setReceiptId(Integer receiptId) { this.receiptId = receiptId; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public Integer getPurchaseOrderId() { return purchaseOrderId; }
    public void setPurchaseOrderId(Integer purchaseOrderId) { this.purchaseOrderId = purchaseOrderId; }

    public Integer getReceivedBy() { return receivedBy; }
    public void setReceivedBy(Integer receivedBy) { this.receivedBy = receivedBy; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTotalItems() { return totalItems; }
    public void setTotalItems(Integer totalItems) { this.totalItems = totalItems; }

    public Boolean getHasDiscrepancies() { return hasDiscrepancies; }
    public void setHasDiscrepancies(Boolean hasDiscrepancies) { this.hasDiscrepancies = hasDiscrepancies; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public List<GoodsReceiptItem> getItems() { return items; }
    public void setItems(List<GoodsReceiptItem> items) { this.items = items; }
}

