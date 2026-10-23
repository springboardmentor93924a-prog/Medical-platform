-- MediStock schema
-- Target: MySQL 5.5+ / MariaDB 10.x (utf8mb4, InnoDB)
-- Usage: mysql -h <host> -u <user> -p <database> < schema.sql

CREATE TABLE IF NOT EXISTS roles (
    role_id   BIGINT      NOT NULL AUTO_INCREMENT,
    role_name VARCHAR(30) NOT NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uk_roles_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS users (
    user_id       BIGINT       NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id       BIGINT       NOT NULL,
    active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_role (role_id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id    BIGINT       NOT NULL AUTO_INCREMENT,
    supplier_name  VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20)  NULL,
    email          VARCHAR(150) NULL,
    address        VARCHAR(255) NULL,
    active         TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS medicines (
    medicine_id   BIGINT       NOT NULL AUTO_INCREMENT,
    medicine_name VARCHAR(150) NOT NULL,
    category      VARCHAR(100) NULL,
    description   TEXT         NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id       BIGINT        NOT NULL AUTO_INCREMENT,
    medicine_id        BIGINT        NOT NULL,
    supplier_id        BIGINT        NULL,
    batch_number       VARCHAR(100)  NOT NULL,
    quantity           INT           NOT NULL DEFAULT 0,
    minimum_stock      INT           NOT NULL DEFAULT 10,
    unit_price         DECIMAL(12,2) NOT NULL,
    manufacturing_date DATE          NULL,
    expiry_date        DATE          NOT NULL,
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (inventory_id),
    KEY idx_inventory_medicine (medicine_id),
    KEY idx_inventory_supplier (supplier_id),
    KEY idx_inventory_expiry (expiry_date),
    CONSTRAINT fk_inventory_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (medicine_id),
    CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS expiry_tracking (
    expiry_tracking_id BIGINT      NOT NULL AUTO_INCREMENT,
    inventory_id       BIGINT      NOT NULL,
    alert_status       VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    last_checked_at    TIMESTAMP   NULL DEFAULT NULL,
    PRIMARY KEY (expiry_tracking_id),
    KEY idx_expiry_tracking_inventory (inventory_id),
    CONSTRAINT fk_expiry_tracking_inventory FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS purchase_orders (
    purchase_order_id BIGINT        NOT NULL AUTO_INCREMENT,
    supplier_id       BIGINT        NOT NULL,
    created_by        BIGINT        NULL,
    order_date        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status            VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    total_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (purchase_order_id),
    KEY idx_purchase_orders_supplier (supplier_id),
    KEY idx_purchase_orders_created_by (created_by),
    KEY idx_purchase_orders_date (order_date),
    CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id),
    CONSTRAINT fk_purchase_orders_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS purchase_order_items (
    item_id           BIGINT        NOT NULL AUTO_INCREMENT,
    purchase_order_id BIGINT        NOT NULL,
    medicine_id       BIGINT        NOT NULL,
    quantity          INT           NOT NULL,
    unit_price        DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (item_id),
    KEY idx_po_items_order (purchase_order_id),
    KEY idx_po_items_medicine (medicine_id),
    CONSTRAINT fk_po_items_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (purchase_order_id),
    CONSTRAINT fk_po_items_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS stock_logs (
    stock_log_id    BIGINT       NOT NULL AUTO_INCREMENT,
    inventory_id    BIGINT       NOT NULL,
    user_id         BIGINT       NULL,
    change_quantity INT          NOT NULL,
    movement_type   VARCHAR(30)  NOT NULL,
    notes           VARCHAR(255) NULL,
    changed_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (stock_log_id),
    KEY idx_stock_logs_inventory (inventory_id),
    KEY idx_stock_logs_user (user_id),
    KEY idx_stock_logs_changed_at (changed_at),
    CONSTRAINT fk_stock_logs_inventory FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id),
    CONSTRAINT fk_stock_logs_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS notifications (
    notification_id   BIGINT       NOT NULL AUTO_INCREMENT,
    user_id           BIGINT       NULL,
    notification_type VARCHAR(50)  NOT NULL,
    message           VARCHAR(500) NOT NULL,
    is_read           TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    KEY idx_notifications_user (user_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS reports (
    report_id    BIGINT       NOT NULL AUTO_INCREMENT,
    report_type  VARCHAR(50)  NOT NULL,
    generated_by BIGINT       NULL,
    file_path    VARCHAR(500) NULL,
    generated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (report_id),
    KEY idx_reports_generated_by (generated_by),
    CONSTRAINT fk_reports_generated_by FOREIGN KEY (generated_by) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- audit_logs.user_id intentionally has NO foreign key so history
-- survives user deletion; performed_by keeps the email snapshot.
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id     BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      BIGINT       NULL,
    action       VARCHAR(50)  NOT NULL,
    entity_type  VARCHAR(50)  NOT NULL,
    entity_id    BIGINT       NULL,
    summary      VARCHAR(255) NULL,
    performed_by VARCHAR(150) NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_id),
    KEY idx_audit_user (user_id),
    KEY idx_audit_action (action),
    KEY idx_audit_entity (entity_type, entity_id),
    KEY idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
