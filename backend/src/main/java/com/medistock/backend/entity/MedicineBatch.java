package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "medicine_batches",
       uniqueConstraints = @UniqueConstraint(columnNames = {"medicine_id", "batch_number"}))
public class MedicineBatch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "medicine_id")
    private Medicine medicine;
    @ManyToOne(optional = false) @JoinColumn(name = "supplier_id")
    private Supplier supplier;
    @Column(name = "batch_number", nullable = false, length = 40)
    private String batchNumber;
    @Column(nullable = false)
    private int quantity;            // current stock of this batch
    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;        // price per unit
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine v) { this.medicine = v; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier v) { this.supplier = v; }
    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String v) { this.batchNumber = v; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int v) { this.quantity = v; }
    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate v) { this.manufacturingDate = v; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate v) { this.expiryDate = v; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal v) { this.price = v; }
    public Instant getCreatedAt() { return createdAt; }
}
