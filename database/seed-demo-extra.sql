-- MediStock demo data (extra)
-- Idempotent: safe to run more than once.
--
--   mysql -h <host> -u <user> -p <db> < database/seed-demo-extra.sql
--
-- All seeded users use password: Password@123
--   admin2@medistock.local       ADMIN
--   pharmacist2@medistock.local  PHARMACIST
--   staff2@medistock.local       STAFF
--   supplier2@medistock.local    SUPPLIER (NovaCare Distributors)

-- =========================================================
-- USERS (one extra per role)
-- =========================================================

INSERT IGNORE INTO users (full_name, email, password_hash, role_id, active, phone)
SELECT 'Priya Nair', 'admin2@medistock.local',
       '$2b$10$IygNWkLAgkU1GThBYHDGSuUZtDfOtwbe0pWV29cs2KejcPMBqLPIu',
       role_id, 1, '+91 90000 00011'
FROM roles WHERE role_name = 'ADMIN';

INSERT IGNORE INTO users (full_name, email, password_hash, role_id, active, phone)
SELECT 'Neha Sharma', 'pharmacist2@medistock.local',
       '$2b$10$IygNWkLAgkU1GThBYHDGSuUZtDfOtwbe0pWV29cs2KejcPMBqLPIu',
       role_id, 1, '+91 90000 00012'
FROM roles WHERE role_name = 'PHARMACIST';

INSERT IGNORE INTO users (full_name, email, password_hash, role_id, active, phone)
SELECT 'Rahul Verma', 'staff2@medistock.local',
       '$2b$10$IygNWkLAgkU1GThBYHDGSuUZtDfOtwbe0pWV29cs2KejcPMBqLPIu',
       role_id, 1, '+91 90000 00013'
FROM roles WHERE role_name = 'STAFF';

INSERT IGNORE INTO users (full_name, email, password_hash, role_id, active, phone)
SELECT 'NovaCare Orders', 'supplier2@medistock.local',
       '$2b$10$IygNWkLAgkU1GThBYHDGSuUZtDfOtwbe0pWV29cs2KejcPMBqLPIu',
       role_id, 1, '+91 90000 00014'
FROM roles WHERE role_name = 'SUPPLIER';

-- =========================================================
-- SUPPLIERS
-- =========================================================

INSERT INTO suppliers (supplier_name, contact_number, email, address, active, medicines)
SELECT 'NovaCare Distributors', '+91 90000 00044',
       'supplier2@medistock.local', '22 Ring Road, Bengaluru 560001', 1,
       'Insulin Glargine 100IU, ORS Powder'
WHERE NOT EXISTS (
    SELECT 1 FROM suppliers WHERE email = 'supplier2@medistock.local'
);

UPDATE suppliers
SET medicines = 'Paracetamol 500mg, Cetirizine 10mg, Azithromycin 500mg, Dolo 650mg'
WHERE supplier_name = 'MedPlus Distributors' AND medicines IS NULL;

UPDATE suppliers
SET medicines = 'Amoxicillin 250mg, Omeprazole 20mg, Vitamin C 500mg, Cough Syrup 100ml'
WHERE supplier_name = 'HealthBridge Supplies' AND medicines IS NULL;

UPDATE suppliers
SET medicines = 'Metformin 500mg, Ibuprofen 400mg'
WHERE supplier_name = 'Apex Pharma Traders' AND medicines IS NULL;

-- =========================================================
-- MEDICINES
-- =========================================================

INSERT INTO medicines (medicine_name, category, description)
SELECT 'Dolo 650mg', 'Analgesic', 'Paracetamol 650 mg tablets for fever and pain'
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE medicine_name = 'Dolo 650mg');

INSERT INTO medicines (medicine_name, category, description)
SELECT 'Insulin Glargine 100IU', 'Antidiabetic', 'Long-acting insulin injection, cold chain'
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE medicine_name = 'Insulin Glargine 100IU');

INSERT INTO medicines (medicine_name, category, description)
SELECT 'Cough Syrup 100ml', 'Respiratory', 'Liquid cough preparation, 100 ml bottle'
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE medicine_name = 'Cough Syrup 100ml');

INSERT INTO medicines (medicine_name, category, description)
SELECT 'ORS Powder', 'Electrolyte', 'Oral rehydration salts, single sachet'
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE medicine_name = 'ORS Powder');

-- =========================================================
-- INVENTORY (safe, low, out-of-stock, near-expiry and expired)
-- =========================================================

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'DOL-2026-I', 320, 80,
       3.20, '2026-01-15', '2027-06-30'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'MedPlus Distributors'
WHERE m.medicine_name = 'Dolo 650mg'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'DOL-2026-I');

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'INS-2026-J', 24, 30,
       45.00, '2026-05-01', '2026-12-05'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'NovaCare Distributors'
WHERE m.medicine_name = 'Insulin Glargine 100IU'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'INS-2026-J');

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'CSY-2026-K', 0, 20,
       6.50, '2026-03-10', '2027-03-31'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'HealthBridge Supplies'
WHERE m.medicine_name = 'Cough Syrup 100ml'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'CSY-2026-K');

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'IBU-2026-L', 90, 40,
       2.10, '2026-02-01', '2026-12-01'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'Apex Pharma Traders'
WHERE m.medicine_name = 'Ibuprofen 400mg'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'IBU-2026-L');

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'AMX-2026-M', 60, 50,
       8.75, '2025-08-01', '2026-08-15'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'HealthBridge Supplies'
WHERE m.medicine_name = 'Amoxicillin 250mg'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'AMX-2026-M');

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'PCM-2027-N', 250, 100,
       2.50, '2026-08-01', '2028-02-28'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'MedPlus Distributors'
WHERE m.medicine_name = 'Paracetamol 500mg'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'PCM-2027-N');

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'ORS-2026-O', 15, 40,
       4.25, '2026-04-01', '2027-05-20'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'NovaCare Distributors'
WHERE m.medicine_name = 'ORS Powder'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'ORS-2026-O');

INSERT INTO inventory
    (medicine_id, supplier_id, batch_number, quantity, minimum_stock,
     unit_price, manufacturing_date, expiry_date)
SELECT m.medicine_id, s.supplier_id, 'AZI-2026-P', 80, 30,
       12.00, '2026-01-01', '2027-01-10'
FROM medicines m
JOIN suppliers s ON s.supplier_name = 'MedPlus Distributors'
WHERE m.medicine_name = 'Azithromycin 500mg'
  AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_number = 'AZI-2026-P');

-- =========================================================
-- PURCHASE ORDERS
-- =========================================================

SET @pharm_id = (SELECT user_id FROM users WHERE email = 'pharmacist@medistock.local');

-- Approved order - HealthBridge
INSERT INTO purchase_orders (supplier_id, created_by, order_date, status, total_amount)
SELECT s.supplier_id, @pharm_id, DATE_SUB(NOW(), INTERVAL 3 DAY), 'APPROVED', 710.00
FROM suppliers s
WHERE s.supplier_name = 'HealthBridge Supplies'
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders p
      WHERE p.supplier_id = s.supplier_id
        AND p.total_amount = 710.00
        AND p.status = 'APPROVED'
  );

SET @po_approved = (
    SELECT p.purchase_order_id FROM purchase_orders p
    JOIN suppliers s ON s.supplier_id = p.supplier_id
    WHERE s.supplier_name = 'HealthBridge Supplies'
      AND p.total_amount = 710.00 AND p.status = 'APPROVED'
    ORDER BY p.purchase_order_id LIMIT 1
);

INSERT INTO purchase_order_items
    (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_approved, m.medicine_id, 100, 3.20, 0
FROM medicines m
WHERE m.medicine_name = 'Dolo 650mg'
  AND @po_approved IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM purchase_order_items i
      WHERE i.purchase_order_id = @po_approved
        AND i.medicine_id = m.medicine_id
  );

INSERT INTO purchase_order_items
    (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_approved, m.medicine_id, 60, 6.50, 0
FROM medicines m
WHERE m.medicine_name = 'Cough Syrup 100ml'
  AND @po_approved IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM purchase_order_items i
      WHERE i.purchase_order_id = @po_approved
        AND i.medicine_id = m.medicine_id
  );

-- Rejected order - Apex
INSERT INTO purchase_orders (supplier_id, created_by, order_date, status, total_amount)
SELECT s.supplier_id, @pharm_id, DATE_SUB(NOW(), INTERVAL 1 DAY), 'REJECTED', 420.00
FROM suppliers s
WHERE s.supplier_name = 'Apex Pharma Traders'
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders p
      WHERE p.supplier_id = s.supplier_id
        AND p.total_amount = 420.00
        AND p.status = 'REJECTED'
  );

SET @po_rejected = (
    SELECT p.purchase_order_id FROM purchase_orders p
    JOIN suppliers s ON s.supplier_id = p.supplier_id
    WHERE s.supplier_name = 'Apex Pharma Traders'
      AND p.total_amount = 420.00 AND p.status = 'REJECTED'
    ORDER BY p.purchase_order_id LIMIT 1
);

INSERT INTO purchase_order_items
    (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_rejected, m.medicine_id, 200, 2.10, 0
FROM medicines m
WHERE m.medicine_name = 'Ibuprofen 400mg'
  AND @po_rejected IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM purchase_order_items i
      WHERE i.purchase_order_id = @po_rejected
        AND i.medicine_id = m.medicine_id
  );

-- Received order - MedPlus
INSERT INTO purchase_orders (supplier_id, created_by, order_date, status, total_amount)
SELECT s.supplier_id, @pharm_id, DATE_SUB(NOW(), INTERVAL 10 DAY), 'RECEIVED', 500.00
FROM suppliers s
WHERE s.supplier_name = 'MedPlus Distributors'
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders p
      WHERE p.supplier_id = s.supplier_id
        AND p.total_amount = 500.00
        AND p.status = 'RECEIVED'
  );

SET @po_received = (
    SELECT p.purchase_order_id FROM purchase_orders p
    JOIN suppliers s ON s.supplier_id = p.supplier_id
    WHERE s.supplier_name = 'MedPlus Distributors'
      AND p.total_amount = 500.00 AND p.status = 'RECEIVED'
    ORDER BY p.purchase_order_id LIMIT 1
);

INSERT INTO purchase_order_items
    (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_received, m.medicine_id, 200, 2.50, 200
FROM medicines m
WHERE m.medicine_name = 'Paracetamol 500mg'
  AND @po_received IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM purchase_order_items i
      WHERE i.purchase_order_id = @po_received
        AND i.medicine_id = m.medicine_id
  );

-- Pending order - NovaCare
INSERT INTO purchase_orders (supplier_id, created_by, order_date, status, total_amount)
SELECT s.supplier_id, @pharm_id, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'PENDING', 662.50
FROM suppliers s
WHERE s.supplier_name = 'NovaCare Distributors'
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders p
      WHERE p.supplier_id = s.supplier_id
        AND p.total_amount = 662.50
        AND p.status = 'PENDING'
  );

SET @po_pending = (
    SELECT p.purchase_order_id FROM purchase_orders p
    JOIN suppliers s ON s.supplier_id = p.supplier_id
    WHERE s.supplier_name = 'NovaCare Distributors'
      AND p.total_amount = 662.50 AND p.status = 'PENDING'
    ORDER BY p.purchase_order_id LIMIT 1
);

INSERT INTO purchase_order_items
    (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_pending, m.medicine_id, 10, 45.00, 0
FROM medicines m
WHERE m.medicine_name = 'Insulin Glargine 100IU'
  AND @po_pending IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM purchase_order_items i
      WHERE i.purchase_order_id = @po_pending
        AND i.medicine_id = m.medicine_id
  );

INSERT INTO purchase_order_items
    (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_pending, m.medicine_id, 50, 4.25, 0
FROM medicines m
WHERE m.medicine_name = 'ORS Powder'
  AND @po_pending IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM purchase_order_items i
      WHERE i.purchase_order_id = @po_pending
        AND i.medicine_id = m.medicine_id
  );

-- Partially received order - HealthBridge
INSERT INTO purchase_orders (supplier_id, created_by, order_date, status, total_amount)
SELECT s.supplier_id, @pharm_id, DATE_SUB(NOW(), INTERVAL 6 DAY), 'PARTIALLY_RECEIVED', 350.00
FROM suppliers s
WHERE s.supplier_name = 'HealthBridge Supplies'
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders p
      WHERE p.supplier_id = s.supplier_id
        AND p.total_amount = 350.00
        AND p.status = 'PARTIALLY_RECEIVED'
  );

SET @po_partial = (
    SELECT p.purchase_order_id FROM purchase_orders p
    JOIN suppliers s ON s.supplier_id = p.supplier_id
    WHERE s.supplier_name = 'HealthBridge Supplies'
      AND p.total_amount = 350.00 AND p.status = 'PARTIALLY_RECEIVED'
    ORDER BY p.purchase_order_id LIMIT 1
);

INSERT INTO purchase_order_items
    (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_partial, m.medicine_id, 40, 8.75, 10
FROM medicines m
WHERE m.medicine_name = 'Amoxicillin 250mg'
  AND @po_partial IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM purchase_order_items i
      WHERE i.purchase_order_id = @po_partial
        AND i.medicine_id = m.medicine_id
  );

-- =========================================================
-- MEDICINE RETURNS (pending + approved, for both suppliers)
-- =========================================================

SET @supplier1_user = (SELECT user_id FROM users WHERE email = 'supplier@medistock.local');
SET @supplier2_user = (SELECT user_id FROM users WHERE email = 'supplier2@medistock.local');

-- Pending review - MedPlus
INSERT INTO medicine_returns
    (return_type, inventory_id, supplier_id, customer_name, customer_contact,
     return_quantity, return_reason, medicine_condition, restock_eligible,
     return_status, created_by, processed_by, return_date, created_at,
     processed_at, notes)
SELECT 'SUPPLIER_RETURN', i.inventory_id, i.supplier_id, NULL, NULL,
       8, 'Seed: short expiry on delivery', 'EXPIRED', 0,
       'PENDING', @supplier1_user, NULL, CURDATE(), DATE_SUB(NOW(), INTERVAL 2 DAY),
       NULL, NULL
FROM inventory i
WHERE i.batch_number = 'AZI-2026-P'
  AND NOT EXISTS (
      SELECT 1 FROM medicine_returns r
      WHERE r.inventory_id = i.inventory_id
        AND r.return_reason = 'Seed: short expiry on delivery'
  );

-- Pending review - NovaCare
INSERT INTO medicine_returns
    (return_type, inventory_id, supplier_id, customer_name, customer_contact,
     return_quantity, return_reason, medicine_condition, restock_eligible,
     return_status, created_by, processed_by, return_date, created_at,
     processed_at, notes)
SELECT 'SUPPLIER_RETURN', i.inventory_id, i.supplier_id, NULL, NULL,
       5, 'Seed: cold-chain excursion during delivery', 'EXPIRED', 0,
       'PENDING', @supplier2_user, NULL, CURDATE(), DATE_SUB(NOW(), INTERVAL 1 DAY),
       NULL, NULL
FROM inventory i
WHERE i.batch_number = 'INS-2026-J'
  AND NOT EXISTS (
      SELECT 1 FROM medicine_returns r
      WHERE r.inventory_id = i.inventory_id
        AND r.return_reason = 'Seed: cold-chain excursion during delivery'
  );

-- Approved, not restockable (counts as wastage)
INSERT INTO medicine_returns
    (return_type, inventory_id, supplier_id, customer_name, customer_contact,
     return_quantity, return_reason, medicine_condition, restock_eligible,
     return_status, created_by, processed_by, return_date, created_at,
     processed_at, notes)
SELECT 'SUPPLIER_RETURN', i.inventory_id, i.supplier_id, NULL, NULL,
       6, 'Seed: damaged blister packs on arrival', 'DAMAGED', 0,
       'APPROVED', @supplier1_user, @pharm_id, DATE_SUB(CURDATE(), INTERVAL 4 DAY),
       DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
       'Seed: approved for wastage disposal'
FROM inventory i
WHERE i.batch_number = 'PCM-2027-N'
  AND NOT EXISTS (
      SELECT 1 FROM medicine_returns r
      WHERE r.inventory_id = i.inventory_id
        AND r.return_reason = 'Seed: damaged blister packs on arrival'
  );

-- Approved, restockable (does not count as wastage)
INSERT INTO medicine_returns
    (return_type, inventory_id, supplier_id, customer_name, customer_contact,
     return_quantity, return_reason, medicine_condition, restock_eligible,
     return_status, created_by, processed_by, return_date, created_at,
     processed_at, notes)
SELECT 'SUPPLIER_RETURN', i.inventory_id, i.supplier_id, NULL, NULL,
       3, 'Seed: over-delivery returned to stock', 'SEALED', 1,
       'APPROVED', @supplier2_user, @pharm_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY),
       DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
       'Seed: returned to saleable stock'
FROM inventory i
WHERE i.batch_number = 'ORS-2026-O'
  AND NOT EXISTS (
      SELECT 1 FROM medicine_returns r
      WHERE r.inventory_id = i.inventory_id
        AND r.return_reason = 'Seed: over-delivery returned to stock'
  );

-- =========================================================
-- STOCK CHECK REPORTS (staff workflow)
-- =========================================================

SET @staff1_user = (SELECT user_id FROM users WHERE email = 'staff@medistock.local');
SET @staff2_user = (SELECT user_id FROM users WHERE email = 'staff2@medistock.local');

INSERT INTO stock_check_reports
    (inventory_id, system_quantity, physical_quantity, difference, remarks,
     reported_by, status, reviewed_by, reviewed_at, review_remarks)
SELECT i.inventory_id, 499, 497, -2,
       'Seed: two strips missing during shelf count',
       @staff1_user, 'PENDING', NULL, NULL, NULL
FROM inventory i
WHERE i.batch_number = 'PCM-2026-A'
  AND NOT EXISTS (
      SELECT 1 FROM stock_check_reports r
      WHERE r.remarks = 'Seed: two strips missing during shelf count'
  );

INSERT INTO stock_check_reports
    (inventory_id, system_quantity, physical_quantity, difference, remarks,
     reported_by, status, reviewed_by, reviewed_at, review_remarks)
SELECT i.inventory_id, 90, 88, -2,
       'Seed: damaged units found during count',
       @staff2_user, 'APPROVED', @pharm_id, DATE_SUB(NOW(), INTERVAL 1 DAY),
       'Seed: adjustment approved'
FROM inventory i
WHERE i.batch_number = 'IBU-2026-L'
  AND NOT EXISTS (
      SELECT 1 FROM stock_check_reports r
      WHERE r.remarks = 'Seed: damaged units found during count'
  );

-- =========================================================
-- STOCK LOGS (movement history)
-- =========================================================

INSERT INTO stock_logs (inventory_id, user_id, change_quantity, movement_type, notes, changed_at)
SELECT i.inventory_id, @pharm_id, 320, 'IN',
       'Seed: opening stock received', DATE_SUB(NOW(), INTERVAL 12 DAY)
FROM inventory i
WHERE i.batch_number = 'DOL-2026-I'
  AND NOT EXISTS (SELECT 1 FROM stock_logs l WHERE l.notes = 'Seed: opening stock received');

INSERT INTO stock_logs (inventory_id, user_id, change_quantity, movement_type, notes, changed_at)
SELECT i.inventory_id, @pharm_id, -2, 'OUT',
       'Seed: FEFO dispense to ward', DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM inventory i
WHERE i.batch_number = 'INS-2026-J'
  AND NOT EXISTS (SELECT 1 FROM stock_logs l WHERE l.notes = 'Seed: FEFO dispense to ward');

INSERT INTO stock_logs (inventory_id, user_id, change_quantity, movement_type, notes, changed_at)
SELECT i.inventory_id, @staff1_user, -5, 'OUT',
       'Seed: expired units quarantined', DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM inventory i
WHERE i.batch_number = 'AMX-2026-M'
  AND NOT EXISTS (SELECT 1 FROM stock_logs l WHERE l.notes = 'Seed: expired units quarantined');

INSERT INTO stock_logs (inventory_id, user_id, change_quantity, movement_type, notes, changed_at)
SELECT i.inventory_id, @pharm_id, -6, 'OUT',
       'Seed: damaged units returned to supplier', DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM inventory i
WHERE i.batch_number = 'PCM-2027-N'
  AND NOT EXISTS (SELECT 1 FROM stock_logs l WHERE l.notes = 'Seed: damaged units returned to supplier');

-- =========================================================
-- NOTIFICATIONS (per role)
-- =========================================================

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT u.user_id, 'LOW_STOCK',
       'Seed: Insulin Glargine 100IU is at 24 units (minimum 30).', 0
FROM users u
WHERE u.email IN ('admin@medistock.local', 'pharmacist@medistock.local')
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.user_id
        AND n.message = 'Seed: Insulin Glargine 100IU is at 24 units (minimum 30).'
  );

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT u.user_id, 'EXPIRING_SOON',
       'Seed: Insulin Glargine 100IU batch INS-2026-J expires on 2026-12-05.', 0
FROM users u
WHERE u.email IN ('admin@medistock.local', 'pharmacist@medistock.local')
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.user_id
        AND n.message = 'Seed: Insulin Glargine 100IU batch INS-2026-J expires on 2026-12-05.'
  );

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT u.user_id, 'EXPIRED',
       'Seed: Amoxicillin 250mg batch AMX-2026-M expired on 2026-08-15.', 0
FROM users u
WHERE u.email IN ('admin@medistock.local', 'pharmacist@medistock.local')
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.user_id
        AND n.message = 'Seed: Amoxicillin 250mg batch AMX-2026-M expired on 2026-08-15.'
  );

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT u.user_id, 'ORDER_PENDING',
       'Seed: 2 supplier returns are waiting for a pharmacist decision.', 0
FROM users u
WHERE u.email = 'pharmacist@medistock.local'
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.user_id
        AND n.message = 'Seed: 2 supplier returns are waiting for a pharmacist decision.'
  );

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT u.user_id, 'LOW_STOCK',
       'Seed: Cetirizine 10mg is out of stock.', 0
FROM users u
WHERE u.email = 'staff@medistock.local'
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.user_id
        AND n.message = 'Seed: Cetirizine 10mg is out of stock.'
  );

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT u.user_id, 'ORDER_PENDING',
       'Seed: your purchase order is approved and ready to supply.', 0
FROM users u
WHERE u.email IN ('supplier@medistock.local', 'supplier2@medistock.local')
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.user_id
        AND n.message = 'Seed: your purchase order is approved and ready to supply.'
  );

-- =========================================================
-- VERIFICATION
-- =========================================================

SELECT 'users' AS dataset, COUNT(*) AS total FROM users
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'medicines', COUNT(*) FROM medicines
UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL SELECT 'purchase_order_items', COUNT(*) FROM purchase_order_items
UNION ALL SELECT 'medicine_returns', COUNT(*) FROM medicine_returns
UNION ALL SELECT 'stock_check_reports', COUNT(*) FROM stock_check_reports
UNION ALL SELECT 'stock_logs', COUNT(*) FROM stock_logs
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications;
