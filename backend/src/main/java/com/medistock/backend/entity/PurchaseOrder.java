package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_number", unique = true, length = 20)
    private String orderNumber;      // e.g. PO-1001, set right after the first save
    @ManyToOne(optional = false) @JoinColumn(name = "supplier_id")
    private Supplier supplier;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;
    @ManyToOne @JoinColumn(name = "created_by")
    private User createdBy;
    @Column(name = "expected_date")
    private LocalDate expectedDate;  // used later to measure supplier performance
    @Column(length = 255)
    private String notes;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "delivered_at")
    private Instant deliveredAt;
    @ManyToOne @JoinColumn(name = "reviewed_by")
    private User reviewedBy;        // the admin who approved or rejected the order
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderItem> items = new ArrayList<>();

    public void addItem(PurchaseOrderItem item) { item.setOrder(this); items.add(item); }

    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String v) { this.orderNumber = v; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier v) { this.supplier = v; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus v) { this.status = v; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User v) { this.createdBy = v; }
    public LocalDate getExpectedDate() { return expectedDate; }
    public void setExpectedDate(LocalDate v) { this.expectedDate = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant v) { this.deliveredAt = v; }
    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User v) { this.reviewedBy = v; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant v) { this.reviewedAt = v; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String v) { this.rejectionReason = v; }
    public List<PurchaseOrderItem> getItems() { return items; }
}
