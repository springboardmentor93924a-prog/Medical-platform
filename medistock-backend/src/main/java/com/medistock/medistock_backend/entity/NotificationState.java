package com.medistock.medistock_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notification_states")
@Getter @Setter @NoArgsConstructor
public class NotificationState {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String notificationKey; // e.g., "exp-1", "stk-5"

    public NotificationState(String notificationKey) {
        this.notificationKey = notificationKey;
    }
}