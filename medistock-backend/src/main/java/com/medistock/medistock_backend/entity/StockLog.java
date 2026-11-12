package com.medistock.medistock_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // Ensures the custom constructor works
public class StockLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    private Integer changeAmount;

    // CHANGED: The InventoryService expects a "reason" field
    private String reason;

    private String performedBy;
    private LocalDateTime timestamp = LocalDateTime.now();

    // Custom constructor for easy logging
    public StockLog(Medicine medicine, Integer changeAmount, String reason) {
        this.medicine = medicine;
        this.changeAmount = changeAmount;
        this.reason = reason;
    }
}