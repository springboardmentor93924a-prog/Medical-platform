package com.medistock.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 30)
    private String username;
    @Column(nullable = false, unique = true, length = 120)
    private String email;
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;           // BCrypt hash, never the real password
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    @Column(nullable = false, length = 20)
    private String phone;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Role role;
    @ManyToOne @JoinColumn(name = "supplier_id")
    private Supplier supplier;       // only set for Supplier logins
    @Column(nullable = false)
    private boolean enabled = true;
    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;
    @Column(name = "locked_until")
    private Instant lockedUntil;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String v) { this.username = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String v) { this.passwordHash = v; }
    public String getFullName() { return fullName; }
    public void setFullName(String v) { this.fullName = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public Role getRole() { return role; }
    public void setRole(Role v) { this.role = v; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier v) { this.supplier = v; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean v) { this.enabled = v; }
    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int v) { this.failedAttempts = v; }
    public Instant getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(Instant v) { this.lockedUntil = v; }
    public Instant getCreatedAt() { return createdAt; }
}
