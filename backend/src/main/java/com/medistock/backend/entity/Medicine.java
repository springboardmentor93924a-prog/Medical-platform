package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "medicines")
public class Medicine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    @ManyToOne(optional = false) @JoinColumn(name = "category_id")
    private Category category;
    @Column(name = "reorder_level", nullable = false)
    private int reorderLevel = 50;
    @Column(nullable = false)
    private boolean active = true;   // "deleting" a medicine switches this off, so history is kept
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public Category getCategory() { return category; }
    public void setCategory(Category v) { this.category = v; }
    public int getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(int v) { this.reorderLevel = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { this.active = v; }
    public Instant getCreatedAt() { return createdAt; }
}
