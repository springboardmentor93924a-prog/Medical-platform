package com.medistock.medistock_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
@Getter @Setter @NoArgsConstructor
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String batchNumber;

    private String category; // e.g., Antibiotic, Analgesic

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(nullable = false)
    private Integer quantity = 0;

    private Integer minQuantity = 10; // For low-stock alerts

    private LocalDate manufacturingDate;
    private LocalDate expiryDate;

    private Double unitPrice = 0.0;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    // ============ WASTAGE TRACKING (new) ============

    @Column(name = "wastage_flag", nullable = false)
    private Boolean wastageFlag = false;

    @Column(name = "wastage_reason", length = 50)
    private String wastageReason; // EXPIRED, DAMAGED, RECALLED, CONTAMINATED

    @Column(name = "wasted_at")
    private LocalDateTime wastedAt;
}