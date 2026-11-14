-- Migration: Add system_settings table and checksum_sha256 to backup_records

ALTER TABLE backup_records ADD COLUMN IF NOT EXISTS checksum_sha256 VARCHAR(64) AFTER record_counts;

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default initial email & notification settings if not present
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('admin.email', 'admin@medistock.com', 'Admin recipient email address for system alerts'),
('mail.host', 'smtp.gmail.com', 'SMTP Hostname'),
('mail.port', '587', 'SMTP Port'),
('mail.username', '', 'SMTP Username / Email address'),
('mail.password', '', 'SMTP Password or 16-character Gmail App Password'),
('mail.from', 'noreply@medistock.com', 'Sender From Email'),
('mail.smtp.auth', 'true', 'SMTP Authentication Enabled'),
('mail.smtp.starttls', 'true', 'SMTP STARTTLS Enabled'),
('mail.smtp.ssl', 'false', 'Direct SSL/TLS Protocol Enabled'),
('notifications.expiry.enabled', 'true', 'Automated Expiry Alerts Enabled'),
('notifications.lowstock.enabled', 'true', 'Low Stock & Out-of-Stock Alerts Enabled'),
('notifications.orders.enabled', 'true', 'Supplier Purchase Order Lifecycle Alerts Enabled'),
('notifications.expiry.days', '30', 'Advance Expiry Threshold Days');
