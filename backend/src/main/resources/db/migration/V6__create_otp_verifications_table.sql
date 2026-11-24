-- MediStock Production Dual-Channel OTP Verification Table
-- Tracks separate Email (Gmail SMTP) and SMS (MSG91) verification challenges

CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NULL,
    email_otp_hash VARCHAR(255) NULL,
    email_otp_expires_at DATETIME(6) NULL,
    email_attempts INT NOT NULL DEFAULT 0,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_request_id VARCHAR(150) NULL,
    phone_otp_hash VARCHAR(255) NULL,
    phone_otp_expires_at DATETIME(6) NULL,
    phone_attempts INT NOT NULL DEFAULT 0,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_sent_at DATETIME(6) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_otp_email (email),
    INDEX idx_otp_phone (phone),
    INDEX idx_otp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

