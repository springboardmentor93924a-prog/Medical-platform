package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_items")
public class PurchaseOrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "order_id")
    private PurchaseOrder order;
    @ManyToOne(optional = false) @JoinColumn(name = "medicine_id")
    private Medicine medicine;
    @Column(nullable = false)
    private int quantity;
    @Column(name = "received_quantity", nullable = false)
    private int receivedQuantity = 0;   // how many units have arrived so far
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    public Long getId() { return id; }
    public PurchaseOrder getOrder() { return order; }
    public void setOrder(PurchaseOrder v) { this.order = v; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine v) { this.medicine = v; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int v) { this.quantity = v; }
    public int getReceivedQuantity() { return receivedQuantity; }
    public void setReceivedQuantity(int v) { this.receivedQuantity = v; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal v) { this.unitPrice = v; }
}
