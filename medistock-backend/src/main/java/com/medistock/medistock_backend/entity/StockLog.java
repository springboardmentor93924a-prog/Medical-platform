package com.medistock.medistock_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_logs")
@Getter @Setter @NoArgsConstructor
public class StockLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    private Integer changeAmount; // +10 or -5
    private String reason; // "New Stock", "Dispensed", "Expired", "Adjustment"

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User performedBy;

    private LocalDateTime timestamp = LocalDateTime.now();
}