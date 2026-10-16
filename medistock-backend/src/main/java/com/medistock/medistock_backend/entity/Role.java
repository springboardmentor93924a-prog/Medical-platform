package com.medistock.medistock_backend.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Roles available in the system: ADMIN, PHARMACIST, STAFF, SUPPLIER.
 * A user can have many roles (many-to-many via user_roles join table).
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;   // ADMIN, PHARMACIST, STAFF, SUPPLIER

    @Column(length = 255)
    private String description;
}