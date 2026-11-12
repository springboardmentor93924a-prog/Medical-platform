package com.medistock.medistock_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    private String userRole;

    @Column(nullable = false)
    private String action; // e.g. CREATE_MEDICINE, APPROVE_PO, LOGIN

    @Column(length = 1000)
    private String details; // e.g. "Amoxicillin 500mg (batch AMX-001)"

    private String entityType; // MEDICINE, PURCHASE_ORDER, USER, TASK, etc.
    private Long entityId;      // ID of the affected entity

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    private String ipAddress;
}