package com.medistock.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.medistock.enums.OrderStatus;
import com.medistock.enums.PaymentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_number", nullable = false, unique = true, length = 50)
    private String poNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDate actualDeliveryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 30)
    private OrderStatus orderStatus = OrderStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<PurchaseOrderItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PurchaseOrder() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.orderDate == null) {
            this.orderDate = LocalDate.now();
        }
        if (this.orderStatus == null) {
            this.orderStatus = OrderStatus.DRAFT;
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = PaymentStatus.PENDING;
        }
        if (this.totalAmount == null) {
            this.totalAmount = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addItem(PurchaseOrderItem item) {
        items.add(item);
        item.setPurchaseOrder(this);
    }

    public void removeItem(PurchaseOrderItem item) {
        items.remove(item);
        item.setPurchaseOrder(null);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public LocalDate getActualDeliveryDate() {
        return actualDeliveryDate;
    }

    public void setActualDeliveryDate(LocalDate actualDeliveryDate) {
        this.actualDeliveryDate = actualDeliveryDate;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public List<PurchaseOrderItem> getItems() {
        return items;
    }

    public void setItems(List<PurchaseOrderItem> items) {
        this.items = items;
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

    // JSON Convenience Properties for frontend rendering
    @JsonProperty("status")
    public OrderStatus getStatus() {
        return orderStatus;
    }

    @JsonProperty("supplierName")
    public String getSupplierName() {
        return supplier != null ? supplier.getCompanyName() : "—";
    }

    @JsonProperty("supplierCompanyName")
    public String getSupplierCompanyName() {
        return supplier != null ? supplier.getCompanyName() : "—";
    }

    @JsonProperty("supplierId")
    public Long getSupplierId() {
        return supplier != null ? supplier.getId() : null;
    }

    @JsonProperty("createdByName")
    public String getCreatedByName() {
        return createdBy != null ? createdBy.getFullName() : "Hospital Staff";
    }

    @JsonProperty("approvedByName")
    public String getApprovedByName() {
        return approvedBy != null ? approvedBy.getFullName() : null;
    }

    @JsonProperty("medicineName")
    public String getMedicineName() {
        if (items != null && !items.isEmpty() && items.get(0).getMedicine() != null) {
            if (items.size() == 1) {
                return items.get(0).getMedicine().getName();
            }
            return items.get(0).getMedicine().getName() + " (+" + (items.size() - 1) + " more)";
        }
        return "—";
    }

    @JsonProperty("medicineCategory")
    public String getMedicineCategory() {
        if (items != null && !items.isEmpty() && items.get(0).getMedicine() != null && items.get(0).getMedicine().getCategory() != null) {
            return items.get(0).getMedicine().getCategory().getName();
        }
        return "—";
    }

    @JsonProperty("requestedQuantity")
    public Integer getRequestedQuantity() {
        if (items != null && !items.isEmpty()) {
            int total = 0;
            for (PurchaseOrderItem item : items) {
                total += (item.getRequestedQuantity() != null ? item.getRequestedQuantity() : 0);
            }
            return total;
        }
        return 0;
    }

    @JsonProperty("unitPrice")
    public BigDecimal getUnitPrice() {
        if (items != null && !items.isEmpty() && items.get(0).getUnitPrice() != null) {
            return items.get(0).getUnitPrice();
        }
        return BigDecimal.ZERO;
    }
}
