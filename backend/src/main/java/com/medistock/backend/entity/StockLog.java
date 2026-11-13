package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "stock_logs")
public class StockLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "batch_id")
    private MedicineBatch batch;
    @Column(name = "change_quantity", nullable = false)
    private int changeQuantity;      // +50 when stock is added, -10 when removed
    @Column(name = "quantity_after", nullable = false)
    private int quantityAfter;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private StockChangeType type;
    @Column(length = 255)
    private String note;
    @ManyToOne @JoinColumn(name = "performed_by")
    private User performedBy;        // empty for automatic changes
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public MedicineBatch getBatch() { return batch; }
    public void setBatch(MedicineBatch v) { this.batch = v; }
    public int getChangeQuantity() { return changeQuantity; }
    public void setChangeQuantity(int v) { this.changeQuantity = v; }
    public int getQuantityAfter() { return quantityAfter; }
    public void setQuantityAfter(int v) { this.quantityAfter = v; }
    public StockChangeType getType() { return type; }
    public void setType(StockChangeType v) { this.type = v; }
    public String getNote() { return note; }
    public void setNote(String v) { this.note = v; }
    public User getPerformedBy() { return performedBy; }
    public void setPerformedBy(User v) { this.performedBy = v; }
    public Instant getCreatedAt() { return createdAt; }
}
