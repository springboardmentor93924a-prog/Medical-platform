-- MediStock migration 001: role modules (pharmacist / staff / supplier)
-- Idempotent: safe to run more than once.
--   mysql -h <host> -u <user> -p <db> < database/migrations/001-role-modules.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS medistock_add_column $$
CREATE PROCEDURE medistock_add_column(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DELIMITER ;

CALL medistock_add_column('users', 'phone', 'VARCHAR(30) NULL');
CALL medistock_add_column('users', 'profile_picture', 'LONGTEXT NULL');
CALL medistock_add_column('suppliers', 'medicines', 'VARCHAR(500) NULL');
CALL medistock_add_column('suppliers', 'profile_image_url', 'VARCHAR(500) NULL');
CALL medistock_add_column('purchase_order_items', 'received_quantity', 'INT NOT NULL DEFAULT 0');

DROP PROCEDURE medistock_add_column;

CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id       BIGINT       NOT NULL AUTO_INCREMENT,
    inventory_id      BIGINT       NOT NULL,
    movement_type     VARCHAR(30)  NOT NULL,
    quantity_changed  INT          NOT NULL,
    previous_quantity INT          NOT NULL,
    new_quantity      INT          NOT NULL,
    reason            VARCHAR(500) NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movement_id),
    KEY idx_movements_inventory (inventory_id),
    KEY idx_movements_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS stock_check_reports (
    report_id         BIGINT       NOT NULL AUTO_INCREMENT,
    inventory_id      BIGINT       NOT NULL,
    system_quantity   INT          NOT NULL,
    physical_quantity INT          NOT NULL,
    difference        INT          NOT NULL,
    remarks           VARCHAR(500) NULL,
    reported_by       BIGINT       NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reviewed_by       BIGINT       NULL,
    reviewed_at       DATETIME     NULL,
    review_remarks    VARCHAR(500) NULL,
    reported_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (report_id),
    KEY idx_scr_inventory (inventory_id),
    KEY idx_scr_status (status),
    KEY idx_scr_reported_by (reported_by),
    KEY idx_scr_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
