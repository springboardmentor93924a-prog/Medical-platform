package com.medistock.dto.backup;

import java.math.BigDecimal;

public class PurchaseOrderItemSnapshot {
    private Long id;
    private String medicineName;
    private String medicineBatch;
    private Integer quantityOrdered;
    private Integer quantityReceived;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    public PurchaseOrderItemSnapshot() {}

    public PurchaseOrderItemSnapshot(Long id, String medicineName, String medicineBatch,
                                     Integer quantityOrdered, Integer quantityReceived,
                                     BigDecimal unitPrice, BigDecimal totalPrice) {
        this.id = id;
        this.medicineName = medicineName;
        this.medicineBatch = medicineBatch;
        this.quantityOrdered = quantityOrdered;
        this.quantityReceived = quantityReceived;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getMedicineBatch() { return medicineBatch; }
    public void setMedicineBatch(String medicineBatch) { this.medicineBatch = medicineBatch; }

    public Integer getQuantityOrdered() { return quantityOrdered; }
    public void setQuantityOrdered(Integer quantityOrdered) { this.quantityOrdered = quantityOrdered; }

    public Integer getQuantityReceived() { return quantityReceived; }
    public void setQuantityReceived(Integer quantityReceived) { this.quantityReceived = quantityReceived; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}
