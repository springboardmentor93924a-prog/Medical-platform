package com.medistock.medistock_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Getter @Setter @NoArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000, nullable = false)
    private String message;

    @Column(nullable = false)
    private String category; // BUG, FEATURE, GENERAL, COMPLAINT

    @Column(nullable = false)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false)
    private String status = "OPEN"; // OPEN, IN_REVIEW, RESOLVED, REJECTED

    // Who submitted it
    @Column(nullable = false)
    private String submittedByEmail;

    private String submittedByName;
    private String submittedByRole;

    // Admin reply (optional)
    @Column(length = 1000)
    private String adminReply;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime resolvedAt;
}