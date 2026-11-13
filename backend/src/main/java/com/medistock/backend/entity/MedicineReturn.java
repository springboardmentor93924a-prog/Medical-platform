package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Medicine sent back to its supplier. Stock leaves only when the return is marked as sent. */
@Entity
@Table(name = "medicine_returns")
public class MedicineReturn {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "batch_id")
    private MedicineBatch batch;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false, length = 20)
    private String reason;           // DAMAGED, EXPIRED, WRONG_ITEM, QUALITY_ISSUE or OVERSTOCK
    @Column(length = 200)
    private String note;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ReturnStatus status = ReturnStatus.REQUESTED;
    @Column(name = "credit_amount", precision = 12, scale = 2)
    private BigDecimal creditAmount;  // money or credit note received from the supplier
    @ManyToOne @JoinColumn(name = "created_by")
    private User createdBy;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "sent_at")
    private Instant sentAt;
    @Column(name = "credited_at")
    private Instant creditedAt;

    public Long getId() { return id; }
    public MedicineBatch getBatch() { return batch; }
    public void setBatch(MedicineBatch v) { this.batch = v; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int v) { this.quantity = v; }
    public String getReason() { return reason; }
    public void setReason(String v) { this.reason = v; }
    public String getNote() { return note; }
    public void setNote(String v) { this.note = v; }
    public ReturnStatus getStatus() { return status; }
    public void setStatus(ReturnStatus v) { this.status = v; }
    public BigDecimal getCreditAmount() { return creditAmount; }
    public void setCreditAmount(BigDecimal v) { this.creditAmount = v; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User v) { this.createdBy = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant v) { this.sentAt = v; }
    public Instant getCreditedAt() { return creditedAt; }
    public void setCreditedAt(Instant v) { this.creditedAt = v; }
}
