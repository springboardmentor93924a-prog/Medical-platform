-- ============================================================================
-- MEDISTOCK: ENTERPRISE SMTP EMAIL NOTIFICATIONS & OUTBOX SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_category VARCHAR(60) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_pref_category UNIQUE (user_id, notification_category),
    CONSTRAINT fk_email_pref_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_outbox (
    outbox_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    idempotency_key VARCHAR(120) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    recipient_user_id INT NULL,
    recipient_email VARCHAR(150) NOT NULL,
    recipient_name VARCHAR(150) NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(60) NOT NULL,
    template_data_json LONGTEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    CONSTRAINT uq_outbox_idempotency UNIQUE (idempotency_key),
    CONSTRAINT fk_email_outbox_user FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_outbox_status_retry (status, next_retry_at),
    INDEX idx_outbox_recipient (recipient_email),
    INDEX idx_outbox_event_type (event_type),
    INDEX idx_outbox_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_notification_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outbox_id BIGINT NULL,
    recipient_user_id INT NULL,
    recipient_email VARCHAR(150) NOT NULL,
    notification_type VARCHAR(60) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    delivery_status VARCHAR(40) NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_log_outbox FOREIGN KEY (outbox_id) REFERENCES email_outbox(outbox_id) ON DELETE SET NULL,
    CONSTRAINT fk_email_log_user FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_log_sent_at (sent_at),
    INDEX idx_log_status (delivery_status),
    INDEX idx_log_recipient (recipient_email),
    INDEX idx_log_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default email preferences for all active users if not exists
INSERT IGNORE INTO email_preferences (user_id, notification_category, is_enabled)
SELECT u.user_id, 'PURCHASE_ORDERS', TRUE FROM users u;

INSERT IGNORE INTO email_preferences (user_id, notification_category, is_enabled)
SELECT u.user_id, 'INVENTORY_ALERTS', TRUE FROM users u;

INSERT IGNORE INTO email_preferences (user_id, notification_category, is_enabled)
SELECT u.user_id, 'EXPIRY_FEFO', TRUE FROM users u;

INSERT IGNORE INTO email_preferences (user_id, notification_category, is_enabled)
SELECT u.user_id, 'TASKS', TRUE FROM users u;

INSERT IGNORE INTO email_preferences (user_id, notification_category, is_enabled)
SELECT u.user_id, 'FEEDBACK', TRUE FROM users u;

INSERT IGNORE INTO email_preferences (user_id, notification_category, is_enabled)
SELECT u.user_id, 'DAILY_DIGEST', TRUE FROM users u;

INSERT IGNORE INTO email_preferences (user_id, notification_category, is_enabled)
SELECT u.user_id, 'SECURITY_ALERTS', TRUE FROM users u;

-- Seed a few historical sample logs for initial presentation
INSERT INTO email_outbox (idempotency_key, event_type, recipient_user_id, recipient_email, recipient_name, subject, template_name, template_data_json, status, priority, attempts, max_attempts, processed_at)
VALUES 
('SEED-PO-APPROVAL-001', 'PURCHASE_ORDER_PENDING', 1, 'admin@medistock.com', 'System Administrator', 'New Purchase Order #PO-2026-092 Awaiting Approval', 'PURCHASE_ORDER', '{"orderId":92,"supplierName":"Apex Medical Supplies Ltd","totalAmount":14250.00,"itemCount":6,"requestedBy":"Alex Rivera"}', 'SENT', 'HIGH', 1, 3, NOW() - INTERVAL 2 HOUR),
('SEED-LOW-STOCK-002', 'CRITICAL_LOW_STOCK', 2, 'pharmacist@medistock.com', 'Alex Rivera', 'CRITICAL ALERT: Amoxicillin 500mg Batch Critical Low Stock', 'INVENTORY_ALERT', '{"medicineName":"Amoxicillin 500mg","batchNumber":"AMX-2026-B1","currentStock":8,"threshold":25,"category":"Antibiotics"}', 'SENT', 'CRITICAL', 1, 3, NOW() - INTERVAL 1 HOUR),
('SEED-TASK-003', 'TASK_ASSIGNED', 3, 'staff@medistock.com', 'Nurse Emily Watson', 'New Operational Task: Temperature & Expiry Audit for Cold Room A', 'TASK_ASSIGNMENT', '{"taskId":14,"title":"Temperature & Expiry Audit for Cold Room A","priority":"HIGH","dueDate":"2026-11-13T10:00:00","assignedBy":"Dr. Sarah Khan"}', 'SENT', 'NORMAL', 1, 3, NOW() - INTERVAL 45 MINUTE),
('SEED-PO-SUPPLIER-004', 'PO_APPROVED_SUPPLIER', 6, 'supplier@medistock.com', 'Apex Medical Supplies Ltd', 'New Purchase Order Placed: PO #PO-2026-092 from MediStock Pharmacy', 'SUPPLIER_DELIVERY', '{"orderId":92,"supplierName":"Apex Medical Supplies Ltd","totalAmount":14250.00,"expectedDelivery":"2026-11-16"}', 'SENT', 'NORMAL', 1, 3, NOW() - INTERVAL 30 MINUTE);

INSERT INTO email_notification_logs (outbox_id, recipient_user_id, recipient_email, notification_type, subject, delivery_status, retry_count, sent_at)
VALUES 
(1, 1, 'admin@medistock.com', 'PURCHASE_ORDER_PENDING', 'New Purchase Order #PO-2026-092 Awaiting Approval', 'SUBMITTED', 0, NOW() - INTERVAL 2 HOUR),
(2, 2, 'pharmacist@medistock.com', 'CRITICAL_LOW_STOCK', 'CRITICAL ALERT: Amoxicillin 500mg Batch Critical Low Stock', 'SUBMITTED', 0, NOW() - INTERVAL 1 HOUR),
(3, 3, 'staff@medistock.com', 'TASK_ASSIGNED', 'New Operational Task: Temperature & Expiry Audit for Cold Room A', 'SUBMITTED', 0, NOW() - INTERVAL 45 MINUTE),
(4, 6, 'supplier@medistock.com', 'PO_APPROVED_SUPPLIER', 'New Purchase Order Placed: PO #PO-2026-092 from MediStock Pharmacy', 'SUBMITTED', 0, NOW() - INTERVAL 30 MINUTE);

