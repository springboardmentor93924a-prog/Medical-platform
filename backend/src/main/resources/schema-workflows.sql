-- ===================================================================
-- MediStock — Workflow Tables: Goods Receipts & Stock Discrepancies
-- Safe, additive migrations for cross-role connected workflows
-- ===================================================================

CREATE TABLE IF NOT EXISTS goods_receipts (
    receipt_id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    purchase_order_id INT NOT NULL,
    received_by INT NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    total_items INT NOT NULL DEFAULT 0,
    has_discrepancies TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receipt_po (purchase_order_id),
    INDEX idx_receipt_user (received_by)
);

CREATE TABLE IF NOT EXISTS goods_receipt_items (
    receipt_item_id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT NOT NULL,
    purchase_order_item_id INT,
    medicine_id INT NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturing_date DATE,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    discrepancy_reason VARCHAR(255),
    INDEX idx_gri_receipt (receipt_id),
    INDEX idx_gri_medicine (medicine_id)
);

CREATE TABLE IF NOT EXISTS stock_discrepancies (
    discrepancy_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT,
    medicine_id INT NOT NULL,
    expected_quantity INT NOT NULL,
    counted_quantity INT NOT NULL,
    discrepancy INT NOT NULL,
    reason TEXT NOT NULL,
    reported_by INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    resolved_by INT,
    resolved_at DATETIME,
    resolution_notes TEXT,
    adjustment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sd_medicine (medicine_id),
    INDEX idx_sd_reported_by (reported_by),
    INDEX idx_sd_status (status)
);

-- FEFO (First Expired, First Out) Inventory & Allocation Schema
ALTER TABLE inventory_batches ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE IF NOT EXISTS fefo_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    batch_id INT NOT NULL,
    user_id INT NOT NULL,
    requested_quantity INT NOT NULL,
    allocated_quantity INT NOT NULL,
    is_fefo_compliant TINYINT(1) NOT NULL DEFAULT 1,
    recommended_batch_id INT,
    batch_expiry_date DATE NOT NULL,
    earliest_available_expiry DATE,
    override_reason VARCHAR(255),
    reference_type VARCHAR(50) DEFAULT 'DISPENSING',
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fefo_med (medicine_id),
    INDEX idx_fefo_batch (batch_id),
    INDEX idx_fefo_user (user_id),
    INDEX idx_fefo_compliant (is_fefo_compliant),
    INDEX idx_fefo_created (created_at)
);

