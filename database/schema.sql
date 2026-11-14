-- MediStock Relational Database Schema
-- Compatible with MySQL 8.x / MariaDB 10.x and PostgreSQL

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    address VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    auth_provider VARCHAR(20) DEFAULT 'LOCAL',
    provider_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    business_registration_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_supplier_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_supplier_status (status),
    INDEX idx_supplier_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150),
    batch_number VARCHAR(80) NOT NULL,
    category_id BIGINT NOT NULL,
    supplier_id BIGINT,
    quantity INT NOT NULL DEFAULT 0,
    minimum_stock_level INT NOT NULL DEFAULT 10,
    unit_price DECIMAL(10, 2) NOT NULL,
    dosage_form VARCHAR(50),
    storage_conditions VARCHAR(100),
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicine_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_medicine_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL,
    INDEX idx_med_batch (batch_number),
    INDEX idx_med_expiry (expiry_date),
    INDEX idx_med_quantity (quantity),
    INDEX idx_med_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    reference_number VARCHAR(100),
    performed_by_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_mov_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_mov_user FOREIGN KEY (performed_by_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_stock_mov_type (movement_type),
    INDEX idx_stock_mov_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    order_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by_id BIGINT,
    approved_by_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    CONSTRAINT fk_po_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_po_approved_by FOREIGN KEY (approved_by_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_po_status (order_status),
    INDEX idx_po_number (po_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    requested_quantity INT NOT NULL,
    received_quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_poi_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_poi_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id BIGINT,
    target_role VARCHAR(20),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(40) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_role (target_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_token_str (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(150),
    user_role VARCHAR(30),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50),
    entity_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_email (user_email),
    INDEX idx_audit_time (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Wastage Reports Table
CREATE TABLE IF NOT EXISTS wastage_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(80) NOT NULL,
    category_id BIGINT,
    supplier_id BIGINT,
    quantity_wasted INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_loss DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    reason VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    review_notes TEXT,
    reported_by_id BIGINT NOT NULL,
    reviewed_by_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    CONSTRAINT fk_wastage_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE,
    CONSTRAINT fk_wastage_reporter FOREIGN KEY (reported_by_id) REFERENCES users (id),
    CONSTRAINT fk_wastage_reviewer FOREIGN KEY (reviewed_by_id) REFERENCES users (id),
    INDEX idx_wastage_status (status),
    INDEX idx_wastage_reason (reason)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. FEFO Overrides Table
CREATE TABLE IF NOT EXISTS fefo_overrides (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requested_medicine_id BIGINT NOT NULL,
    recommended_medicine_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    override_reason VARCHAR(255) NOT NULL,
    requested_expiry_date DATE NOT NULL,
    recommended_expiry_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fefo_requested FOREIGN KEY (requested_medicine_id) REFERENCES medicines (id) ON DELETE CASCADE,
    CONSTRAINT fk_fefo_recommended FOREIGN KEY (recommended_medicine_id) REFERENCES medicines (id) ON DELETE CASCADE,
    CONSTRAINT fk_fefo_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    description TEXT NOT NULL,
    rating INT DEFAULT 5,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    admin_response TEXT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_feedback_status (status),
    INDEX idx_feedback_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Backup Records Table
CREATE TABLE IF NOT EXISTS backup_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(150) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    record_counts TEXT,
    checksum_sha256 VARCHAR(64),
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_backup_user FOREIGN KEY (created_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. System Settings Table (Dynamic Thresholds & Preferences)
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

