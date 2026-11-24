package com.medistock.medistock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "goods_receipt_items")
public class GoodsReceiptItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "receipt_item_id")
    private Integer receiptItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    @JsonIgnore
    private GoodsReceipt goodsReceipt;

    @Column(name = "purchase_order_item_id")
    private Integer purchaseOrderItemId;

    @Column(name = "medicine_id", nullable = false)
    private Integer medicineId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", insertable = false, updatable = false)
    private Medicine medicine;

    @Column(name = "quantity_ordered", nullable = false)
    private Integer quantityOrdered;

    @Column(name = "quantity_received", nullable = false)
    private Integer quantityReceived;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;

    @Column(name = "unit_cost")
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "discrepancy_reason", length = 255)
    private String discrepancyReason;

    public GoodsReceiptItem() {}

    public Integer getReceiptItemId() { return receiptItemId; }
    public void setReceiptItemId(Integer receiptItemId) { this.receiptItemId = receiptItemId; }

    public GoodsReceipt getGoodsReceipt() { return goodsReceipt; }
    public void setGoodsReceipt(GoodsReceipt goodsReceipt) { this.goodsReceipt = goodsReceipt; }

    public Integer getPurchaseOrderItemId() { return purchaseOrderItemId; }
    public void setPurchaseOrderItemId(Integer purchaseOrderItemId) { this.purchaseOrderItemId = purchaseOrderItemId; }

    public Integer getMedicineId() { return medicineId; }
    public void setMedicineId(Integer medicineId) { this.medicineId = medicineId; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

    public Integer getQuantityOrdered() { return quantityOrdered; }
    public void setQuantityOrdered(Integer quantityOrdered) { this.quantityOrdered = quantityOrdered; }

    public Integer getQuantityReceived() { return quantityReceived; }
    public void setQuantityReceived(Integer quantityReceived) { this.quantityReceived = quantityReceived; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public String getDiscrepancyReason() { return discrepancyReason; }
    public void setDiscrepancyReason(String discrepancyReason) { this.discrepancyReason = discrepancyReason; }
}

