package com.medistock.medistock.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_items")
public class PurchaseOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_item_id")
    private Integer purchaseOrderItemId;

    @Column(name = "purchase_order_id", nullable = false)
    private Integer purchaseOrderId;

    @Column(name = "medicine_id", nullable = false)
    private Integer medicineId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "subtotal", insertable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", insertable = false, updatable = false)
    private Medicine medicine;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", insertable = false, updatable = false)
    private PurchaseOrder purchaseOrder;

    public PurchaseOrderItem() {
    }

    public Integer getPurchaseOrderItemId() {
        return purchaseOrderItemId;
    }

    public void setPurchaseOrderItemId(Integer purchaseOrderItemId) {
        this.purchaseOrderItemId = purchaseOrderItemId;
    }

    public Integer getPurchaseOrderId() {
        return purchaseOrderId;
    }

    public void setPurchaseOrderId(Integer purchaseOrderId) {
        this.purchaseOrderId = purchaseOrderId;
    }

    public Integer getMedicineId() {
        return medicineId;
    }

    public void setMedicineId(Integer medicineId) {
        this.medicineId = medicineId;
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

    public BigDecimal getSubtotal() {
        if (subtotal != null) return subtotal;
        if (unitCost != null && quantity != null) {
            return unitCost.multiply(BigDecimal.valueOf(quantity));
        }
        return BigDecimal.ZERO;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public Medicine getMedicine() {
        return medicine;
    }

    public void setMedicine(Medicine medicine) {
        this.medicine = medicine;
    }

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public void setPurchaseOrder(PurchaseOrder purchaseOrder) {
        this.purchaseOrder = purchaseOrder;
    }
}
