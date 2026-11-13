-- MediStock migration 002: medicine return tracking
-- Idempotent: safe to run more than once.
--   mysql -h <host> -u <user> -p <db> < database/migrations/002-medicine-returns.sql

CREATE TABLE IF NOT EXISTS medicine_returns (
    return_id         BIGINT       NOT NULL AUTO_INCREMENT,
    return_type       VARCHAR(30)  NOT NULL,
    inventory_id      BIGINT       NOT NULL,
    supplier_id       BIGINT       NULL,
    customer_name     VARCHAR(150) NULL,
    customer_contact  VARCHAR(30)  NULL,
    return_quantity   INT          NOT NULL,
    return_reason     VARCHAR(500) NOT NULL,
    medicine_condition VARCHAR(30) NOT NULL,
    restock_eligible  TINYINT(1)   NOT NULL DEFAULT 0,
    return_status     VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_by        BIGINT       NOT NULL,
    processed_by      BIGINT       NULL,
    return_date       DATE         NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at      DATETIME     NULL,
    notes             VARCHAR(500) NULL,
    PRIMARY KEY (return_id),
    KEY idx_returns_type (return_type),
    KEY idx_returns_inventory (inventory_id),
    KEY idx_returns_supplier (supplier_id),
    KEY idx_returns_status (return_status),
    KEY idx_returns_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
