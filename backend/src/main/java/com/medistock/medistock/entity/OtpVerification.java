package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications")
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "email_otp_hash", length = 255)
    private String emailOtpHash;

    @Column(name = "email_otp_expires_at")
    private LocalDateTime emailOtpExpiresAt;

    @Column(name = "email_attempts", nullable = false)
    private int emailAttempts = 0;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "phone_request_id", length = 150)
    private String phoneRequestId;

    @Column(name = "phone_otp_hash", length = 255)
    private String phoneOtpHash;

    @Column(name = "phone_otp_expires_at")
    private LocalDateTime phoneOtpExpiresAt;

    @Column(name = "phone_attempts", nullable = false)
    private int phoneAttempts = 0;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified = false;

    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING_VERIFICATION";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public OtpVerification() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmailOtpHash() {
        return emailOtpHash;
    }

    public void setEmailOtpHash(String emailOtpHash) {
        this.emailOtpHash = emailOtpHash;
    }

    public LocalDateTime getEmailOtpExpiresAt() {
        return emailOtpExpiresAt;
    }

    public void setEmailOtpExpiresAt(LocalDateTime emailOtpExpiresAt) {
        this.emailOtpExpiresAt = emailOtpExpiresAt;
    }

    public int getEmailAttempts() {
        return emailAttempts;
    }

    public void setEmailAttempts(int emailAttempts) {
        this.emailAttempts = emailAttempts;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getPhoneRequestId() {
        return phoneRequestId;
    }

    public void setPhoneRequestId(String phoneRequestId) {
        this.phoneRequestId = phoneRequestId;
    }

    public String getPhoneOtpHash() {
        return phoneOtpHash;
    }

    public void setPhoneOtpHash(String phoneOtpHash) {
        this.phoneOtpHash = phoneOtpHash;
    }

    public LocalDateTime getPhoneOtpExpiresAt() {
        return phoneOtpExpiresAt;
    }

    public void setPhoneOtpExpiresAt(LocalDateTime phoneOtpExpiresAt) {
        this.phoneOtpExpiresAt = phoneOtpExpiresAt;
    }

    public int getPhoneAttempts() {
        return phoneAttempts;
    }

    public void setPhoneAttempts(int phoneAttempts) {
        this.phoneAttempts = phoneAttempts;
    }

    public boolean isPhoneVerified() {
        return phoneVerified;
    }

    public void setPhoneVerified(boolean phoneVerified) {
        this.phoneVerified = phoneVerified;
    }

    public LocalDateTime getLastSentAt() {
        return lastSentAt;
    }

    public void setLastSentAt(LocalDateTime lastSentAt) {
        this.lastSentAt = lastSentAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

