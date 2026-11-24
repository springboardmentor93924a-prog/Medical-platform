-- ============================================================================
-- MEDISTOCK: MEDICINE RETURN TRACKING, QUARANTINE & INSPECTION SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS medicine_returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    return_number VARCHAR(50) NOT NULL,
    return_source VARCHAR(40) NOT NULL, -- DEPARTMENT_RETURN, PATIENT_RETURN, SUPPLIER_RETURN, INTERNAL_RECALL
    batch_id INT NOT NULL,
    medicine_id INT NOT NULL,
    supplier_id INT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    return_reason VARCHAR(100) NOT NULL,
    reason_details TEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'QUARANTINED', 
    -- REQUESTED, UNDER_INSPECTION, QUARANTINED, APPROVED_FOR_RESTOCK, RESTOCKED, RETURNED_TO_SUPPLIER, TRANSFERRED_TO_WASTAGE, REJECTED, CLOSED
    requested_by INT NOT NULL,
    source_role VARCHAR(30) NOT NULL,
    department VARCHAR(100) NULL,
    inspected_by INT NULL,
    inspected_at TIMESTAMP NULL,
    inspection_notes TEXT NULL,
    quality_status VARCHAR(40) NULL, -- PASSED_QUALITY_CHECK, FAILED_DAMAGED, FAILED_EXPIRED, FAILED_CONTAMINATED
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    resolution_action VARCHAR(50) NULL, -- RESTOCK_USABLE_INVENTORY, DISPOSE_TO_WASTAGE, DISPATCH_TO_SUPPLIER_CREDIT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_return_number UNIQUE (return_number),
    CONSTRAINT fk_return_batch FOREIGN KEY (batch_id) REFERENCES inventory_batches(batch_id) ON DELETE RESTRICT,
    CONSTRAINT fk_return_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE RESTRICT,
    CONSTRAINT fk_return_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
    CONSTRAINT fk_return_requester FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_return_inspector FOREIGN KEY (inspected_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_return_approver FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_return_status (status),
    INDEX idx_return_batch (batch_id),
    INDEX idx_return_medicine (medicine_id),
    INDEX idx_return_supplier (supplier_id),
    INDEX idx_return_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS return_inspections (
    inspection_id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT NOT NULL,
    inspector_id INT NOT NULL,
    inspection_type VARCHAR(50) NOT NULL, -- PHYSICAL_INTEGRITY, TEMPERATURE_SEAL, EXPIRY_VERIFICATION, QUALITY_AUDIT
    packaging_intact BOOLEAN NOT NULL DEFAULT TRUE,
    temperature_maintained BOOLEAN NOT NULL DEFAULT TRUE,
    batch_verified BOOLEAN NOT NULL DEFAULT TRUE,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    findings TEXT NULL,
    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_insp_return FOREIGN KEY (return_id) REFERENCES medicine_returns(return_id) ON DELETE CASCADE,
    CONSTRAINT fk_insp_user FOREIGN KEY (inspector_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_insp_return (return_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed realistic sample records across multiple states for immediate presentation
INSERT INTO medicine_returns (
    return_number, return_source, batch_id, medicine_id, supplier_id, quantity, unit_cost, total_value,
    return_reason, reason_details, status, requested_by, source_role, department, quality_status, created_at
) VALUES 
('RET-2026-0001', 'DEPARTMENT_RETURN', 1, 1, 1, 20, 12.50, 250.00, 'OVERSTOCK_SURPLUS', 'General Ward surplus returned un-opened after surgery block rescheduling.', 'QUARANTINED', 3, 'STAFF', 'Surgery Unit A', 'PASSED_QUALITY_CHECK', NOW() - INTERVAL 2 DAY),
('RET-2026-0002', 'PATIENT_RETURN', 2, 2, 1, 10, 18.00, 180.00, 'PATIENT_DISCONTINUED', 'Treatment regimen adjusted by physician; outer seals intact.', 'UNDER_INSPECTION', 2, 'PHARMACIST', 'Outpatient Dispensary', NULL, NOW() - INTERVAL 1 DAY),
('RET-2026-0003', 'SUPPLIER_RETURN', 1, 1, 1, 15, 12.50, 187.50, 'DAMAGED_PACKAGING', 'Crushed carton corners observed upon receipt dock unpacking.', 'APPROVED_FOR_RESTOCK', 2, 'PHARMACIST', 'Central Pharmacy', 'PASSED_QUALITY_CHECK', NOW() - INTERVAL 12 HOUR);

