package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** A physical count made on the shelf. Saving a count never changes the stock itself. */
@Entity
@Table(name = "stock_counts")
public class StockCount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "batch_id")
    private MedicineBatch batch;
    @Column(name = "system_quantity", nullable = false)
    private int systemQuantity;      // what the system said when the count was made
    @Column(name = "counted_quantity", nullable = false)
    private int countedQuantity;     // what the person found on the shelf
    @Column(length = 255)
    private String note;
    @ManyToOne(optional = false) @JoinColumn(name = "counted_by")
    private User countedBy;
    @Column(name = "counted_at", nullable = false, updatable = false)
    private Instant countedAt = Instant.now();
    @Column(nullable = false)
    private boolean reviewed = false;   // set by the Pharmacist or Admin once they have looked at a difference
    @ManyToOne @JoinColumn(name = "reviewed_by")
    private User reviewedBy;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    public Long getId() { return id; }
    public MedicineBatch getBatch() { return batch; }
    public void setBatch(MedicineBatch v) { this.batch = v; }
    public int getSystemQuantity() { return systemQuantity; }
    public void setSystemQuantity(int v) { this.systemQuantity = v; }
    public int getCountedQuantity() { return countedQuantity; }
    public void setCountedQuantity(int v) { this.countedQuantity = v; }
    public String getNote() { return note; }
    public void setNote(String v) { this.note = v; }
    public User getCountedBy() { return countedBy; }
    public void setCountedBy(User v) { this.countedBy = v; }
    public Instant getCountedAt() { return countedAt; }
    public boolean isReviewed() { return reviewed; }
    public void setReviewed(boolean v) { this.reviewed = v; }
    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User v) { this.reviewedBy = v; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant v) { this.reviewedAt = v; }
}
