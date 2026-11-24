-- ===================================================================
-- MediStock Advanced Database Backup & Restore Management Schema
-- ===================================================================

CREATE TABLE IF NOT EXISTS backup_records (
    backup_id INT AUTO_INCREMENT PRIMARY KEY,
    backup_reference VARCHAR(64) NOT NULL UNIQUE,
    backup_name VARCHAR(150) NOT NULL,
    description TEXT,
    backup_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL', -- MANUAL, AUTOMATIC_SCHEDULED, PRE_RESTORE
    scope VARCHAR(50) NOT NULL DEFAULT 'FULL_DATABASE', -- FULL_DATABASE, SCHEMA_ONLY, DATA_ONLY
    file_name VARCHAR(255) NOT NULL,
    file_location VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    checksum VARCHAR(128) NOT NULL, -- SHA-256
    encryption_status VARCHAR(30) NOT NULL DEFAULT 'AES_256', -- AES_256, NONE
    backup_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, IN_PROGRESS, FAILED, VERIFIED, CORRUPTED
    database_version VARCHAR(100),
    tables_included INT NOT NULL DEFAULT 0,
    records_count BIGINT NOT NULL DEFAULT 0,
    created_by VARCHAR(150) NOT NULL DEFAULT 'System Administrator',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME NULL,
    verification_notes TEXT,
    INDEX idx_bkp_ref (backup_reference),
    INDEX idx_bkp_type (backup_type),
    INDEX idx_bkp_status (backup_status),
    INDEX idx_bkp_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backup_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_name VARCHAR(100) NOT NULL,
    frequency VARCHAR(30) NOT NULL, -- DAILY, WEEKLY, MONTHLY, CUSTOM_HOURLY
    scheduled_time VARCHAR(10) NOT NULL DEFAULT '02:00',
    cron_expression VARCHAR(60) NOT NULL DEFAULT '0 0 2 * * ?',
    enabled BOOLEAN NOT NULL DEFAULT 1,
    retention_days INT NOT NULL DEFAULT 30,
    backup_type VARCHAR(30) NOT NULL DEFAULT 'AUTOMATIC_SCHEDULED',
    last_run_at DATETIME NULL,
    next_run_at DATETIME NULL,
    last_status VARCHAR(30) DEFAULT 'IDLE',
    created_by VARCHAR(150) NOT NULL DEFAULT 'System Administrator',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sch_enabled (enabled),
    INDEX idx_sch_freq (frequency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS restore_history (
    restore_id INT AUTO_INCREMENT PRIMARY KEY,
    restore_reference VARCHAR(64) NOT NULL UNIQUE,
    backup_reference VARCHAR(64) NOT NULL,
    backup_id INT NULL,
    pre_restore_backup_ref VARCHAR(64) NULL,
    restore_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- IN_PROGRESS, STAGING_VERIFIED, COMPLETED, FAILED, ROLLED_BACK
    recovery_point VARCHAR(100) NULL,
    target_database VARCHAR(100) NOT NULL DEFAULT 'medistock',
    tables_restored INT NOT NULL DEFAULT 0,
    records_restored BIGINT NOT NULL DEFAULT 0,
    initiated_by VARCHAR(150) NOT NULL DEFAULT 'System Administrator',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    failure_reason TEXT,
    verification_report TEXT,
    INDEX idx_rst_ref (restore_reference),
    INDEX idx_rst_bkp (backup_reference),
    INDEX idx_rst_status (restore_status),
    INDEX idx_rst_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial standard schedules if not present
INSERT INTO backup_schedules (schedule_name, frequency, scheduled_time, cron_expression, enabled, retention_days, created_by)
SELECT 'Daily Midnight Automated Backup', 'DAILY', '02:00', '0 0 2 * * ?', 1, 30, 'System Administrator'
WHERE NOT EXISTS (SELECT 1 FROM backup_schedules WHERE schedule_name = 'Daily Midnight Automated Backup');

INSERT INTO backup_schedules (schedule_name, frequency, scheduled_time, cron_expression, enabled, retention_days, created_by)
SELECT 'Weekly Full Archival Backup', 'WEEKLY', '03:00', '0 0 3 ? * SUN', 1, 90, 'System Administrator'
WHERE NOT EXISTS (SELECT 1 FROM backup_schedules WHERE schedule_name = 'Weekly Full Archival Backup');

INSERT INTO backup_schedules (schedule_name, frequency, scheduled_time, cron_expression, enabled, retention_days, created_by)
SELECT 'Monthly Regulatory Compliance Backup', 'MONTHLY', '04:00', '0 0 4 1 * ?', 1, 365, 'System Administrator'
WHERE NOT EXISTS (SELECT 1 FROM backup_schedules WHERE schedule_name = 'Monthly Regulatory Compliance Backup');

