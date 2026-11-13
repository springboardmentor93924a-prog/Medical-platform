-- MediStock demo data for the original quick-login accounts
-- (the four accounts wired to the "Quick demo login" buttons).
--
--   ADMIN       admin@medistock.local
--   PHARMACIST  pharmacist@medistock.local
--   STAFF       staff@medistock.local
--   SUPPLIER    supplier@medistock.local  (MedPlus Distributors)
--
-- Idempotent: safe to run more than once.
--   mysql -h <host> -u <user> -p <db> < database/seed-demo-old-roles.sql

SET @admin_user  = (SELECT user_id FROM users WHERE email = 'admin@medistock.local');
SET @pharm_user  = (SELECT user_id FROM users WHERE email = 'pharmacist@medistock.local');
SET @staff_user  = (SELECT user_id FROM users WHERE email = 'staff@medistock.local');
SET @supp_user   = (SELECT user_id FROM users WHERE email = 'supplier@medistock.local');

-- =========================================================
-- SUPPLIER PURCHASE ORDERS (MedPlus = supplier@)
-- =========================================================

INSERT INTO purchase_orders (supplier_id, created_by, order_date, status, total_amount)
SELECT s.supplier_id, @pharm_user, DATE_SUB(NOW(), INTERVAL 5 DAY), 'APPROVED', 640.00
FROM suppliers s
WHERE s.supplier_name = 'MedPlus Distributors'
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders p
      WHERE p.supplier_id = s.supplier_id
        AND p.total_amount = 640.00 AND p.status = 'APPROVED'
  );

SET @po_640 = (
    SELECT p.purchase_order_id FROM purchase_orders p
    WHERE p.supplier_id = (SELECT supplier_id FROM suppliers WHERE supplier_name = 'MedPlus Distributors')
      AND p.total_amount = 640.00 AND p.status = 'APPROVED'
    ORDER BY p.purchase_order_id LIMIT 1
);

INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_640, m.medicine_id, 100, 3.20, 0 FROM medicines m
WHERE m.medicine_name = 'Dolo 650mg' AND @po_640 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM purchase_order_items i
                  WHERE i.purchase_order_id = @po_640 AND i.medicine_id = m.medicine_id);

INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_640, m.medicine_id, 20, 12.00, 0 FROM medicines m
WHERE m.medicine_name = 'Azithromycin 500mg' AND @po_640 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM purchase_order_items i
                  WHERE i.purchase_order_id = @po_640 AND i.medicine_id = m.medicine_id);

INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_640, m.medicine_id, 80, 1.00, 0 FROM medicines m
WHERE m.medicine_name = 'Cetirizine 10mg' AND @po_640 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM purchase_order_items i
                  WHERE i.purchase_order_id = @po_640 AND i.medicine_id = m.medicine_id);

INSERT INTO purchase_orders (supplier_id, created_by, order_date, status, total_amount)
SELECT s.supplier_id, @pharm_user, DATE_SUB(NOW(), INTERVAL 2 DAY), 'REJECTED', 260.00
FROM suppliers s
WHERE s.supplier_name = 'MedPlus Distributors'
  AND NOT EXISTS (
      SELECT 1 FROM purchase_orders p
      WHERE p.supplier_id = s.supplier_id
        AND p.total_amount = 260.00 AND p.status = 'REJECTED'
  );

SET @po_260 = (
    SELECT p.purchase_order_id FROM purchase_orders p
    WHERE p.supplier_id = (SELECT supplier_id FROM suppliers WHERE supplier_name = 'MedPlus Distributors')
      AND p.total_amount = 260.00 AND p.status = 'REJECTED'
    ORDER BY p.purchase_order_id LIMIT 1
);

INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_260, m.medicine_id, 100, 2.50, 0 FROM medicines m
WHERE m.medicine_name = 'Paracetamol 500mg' AND @po_260 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM purchase_order_items i
                  WHERE i.purchase_order_id = @po_260 AND i.medicine_id = m.medicine_id);

INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_price, received_quantity)
SELECT @po_260, m.medicine_id, 10, 1.00, 0 FROM medicines m
WHERE m.medicine_name = 'Cetirizine 10mg' AND @po_260 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM purchase_order_items i
                  WHERE i.purchase_order_id = @po_260 AND i.medicine_id = m.medicine_id);

-- =========================================================
-- SUPPLIER RETURNS (submitted by supplier@)
-- =========================================================

INSERT INTO medicine_returns
    (return_type, inventory_id, supplier_id, customer_name, customer_contact,
     return_quantity, return_reason, medicine_condition, restock_eligible,
     return_status, created_by, processed_by, return_date, created_at,
     processed_at, notes)
SELECT 'SUPPLIER_RETURN', i.inventory_id, i.supplier_id, NULL, NULL,
       4, 'Seed: leaking bottles on delivery', 'DAMAGED', 0,
       'PENDING', @supp_user, NULL, CURDATE(), DATE_SUB(NOW(), INTERVAL 5 HOUR),
       NULL, NULL
FROM inventory i
WHERE i.batch_number = 'DOL-2026-I'
  AND NOT EXISTS (SELECT 1 FROM medicine_returns r
                  WHERE r.inventory_id = i.inventory_id
                    AND r.return_reason = 'Seed: leaking bottles on delivery');

INSERT INTO medicine_returns
    (return_type, inventory_id, supplier_id, customer_name, customer_contact,
     return_quantity, return_reason, medicine_condition, restock_eligible,
     return_status, created_by, processed_by, return_date, created_at,
     processed_at, notes)
SELECT 'SUPPLIER_RETURN', i.inventory_id, i.supplier_id, NULL, NULL,
       10, 'Seed: over-supply returned to shelf', 'SEALED', 1,
       'APPROVED', @supp_user, @pharm_user, DATE_SUB(CURDATE(), INTERVAL 6 DAY),
       DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY),
       'Seed: returned to saleable stock'
FROM inventory i
WHERE i.batch_number = 'AZI-2026-P'
  AND NOT EXISTS (SELECT 1 FROM medicine_returns r
                  WHERE r.inventory_id = i.inventory_id
                    AND r.return_reason = 'Seed: over-supply returned to shelf');

-- =========================================================
-- STAFF STOCK CHECKS (reported by staff@)
-- =========================================================

INSERT INTO stock_check_reports
    (inventory_id, system_quantity, physical_quantity, difference, remarks,
     reported_by, status, reviewed_by, reviewed_at, review_remarks)
SELECT i.inventory_id, 15, 14, -1,
       'Seed: one ORS sachet missing at shelf count',
       @staff_user, 'APPROVED', @pharm_user, DATE_SUB(NOW(), INTERVAL 1 DAY),
       'Seed: adjustment approved'
FROM inventory i
WHERE i.batch_number = 'ORS-2026-O'
  AND NOT EXISTS (SELECT 1 FROM stock_check_reports r
                  WHERE r.remarks = 'Seed: one ORS sachet missing at shelf count');

INSERT INTO stock_check_reports
    (inventory_id, system_quantity, physical_quantity, difference, remarks,
     reported_by, status, reviewed_by, reviewed_at, review_remarks)
SELECT i.inventory_id, 60, 52, -8,
       'Seed: expired units found during count',
       @staff_user, 'REJECTED', @pharm_user, DATE_SUB(NOW(), INTERVAL 2 DAY),
       'Seed: please recount the quarantined shelf'
FROM inventory i
WHERE i.batch_number = 'AMX-2026-M'
  AND NOT EXISTS (SELECT 1 FROM stock_check_reports r
                  WHERE r.remarks = 'Seed: expired units found during count');

-- =========================================================
-- NOTIFICATIONS for the quick-login accounts
-- =========================================================

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @admin_user, 'ORDER_PENDING',
       'Seed: 3 purchase orders are waiting for approval.', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @admin_user
                    AND n.message = 'Seed: 3 purchase orders are waiting for approval.');

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @admin_user, 'LOW_STOCK',
       'Seed: 4 batches are below minimum stock.', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @admin_user
                    AND n.message = 'Seed: 4 batches are below minimum stock.');

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @pharm_user, 'ORDER_PENDING',
       'Seed: supplier returns are waiting for your decision.', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @pharm_user
                    AND n.message = 'Seed: supplier returns are waiting for your decision.');

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @pharm_user, 'EXPIRING_SOON',
       'Seed: Azithromycin 500mg batch AZI-2026-P expires on 2027-01-10.', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @pharm_user
                    AND n.message = 'Seed: Azithromycin 500mg batch AZI-2026-P expires on 2027-01-10.');

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @staff_user, 'EXPIRED',
       'Seed: Amoxicillin 250mg batch AMX-2026-M expired and must be removed.', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @staff_user
                    AND n.message = 'Seed: Amoxicillin 250mg batch AMX-2026-M expired and must be removed.');

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @staff_user, 'LOW_STOCK',
       'Seed: ORS Powder is at 15 units (minimum 40).', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @staff_user
                    AND n.message = 'Seed: ORS Powder is at 15 units (minimum 40).');

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @supp_user, 'ORDER_PENDING',
       'Seed: purchase order for 640.00 is approved and ready to supply.', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @supp_user
                    AND n.message = 'Seed: purchase order for 640.00 is approved and ready to supply.');

INSERT INTO notifications (user_id, notification_type, message, is_read)
SELECT @supp_user, 'ORDER_PENDING',
       'Seed: 1 return has been approved for collection.', 0
WHERE NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.user_id = @supp_user
                    AND n.message = 'Seed: 1 return has been approved for collection.');

-- =========================================================
-- AUDIT LOGS (System Monitoring tab)
-- =========================================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @admin_user, 'LOGIN', 'USER', @admin_user,
       'Seed: admin signed in', 'admin@medistock.local', DATE_SUB(NOW(), INTERVAL 6 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: admin signed in');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @pharm_user, 'CREATE', 'PURCHASE_ORDER', @po_640,
       'Seed: purchase order 640.00 raised for MedPlus', 'pharmacist@medistock.local',
       DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: purchase order 640.00 raised for MedPlus');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @admin_user, 'UPDATE', 'PURCHASE_ORDER', @po_640,
       'Seed: purchase order 640.00 approved', 'admin@medistock.local',
       DATE_SUB(NOW(), INTERVAL 4 DAY)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: purchase order 640.00 approved');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @staff_user, 'STOCK_OUT', 'INVENTORY', NULL,
       'Seed: expired units quarantined', 'staff@medistock.local',
       DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: expired units quarantined');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @pharm_user, 'STOCK_IN', 'INVENTORY', NULL,
       'Seed: opening stock received for Dolo 650mg', 'pharmacist@medistock.local',
       DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: opening stock received for Dolo 650mg');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @admin_user, 'REPORT_GENERATED', 'REPORT', NULL,
       'Seed: wastage report exported as CSV', 'admin@medistock.local',
       DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: wastage report exported as CSV');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @staff_user, 'LOGIN', 'USER', @staff_user,
       'Seed: staff signed in', 'staff@medistock.local', DATE_SUB(NOW(), INTERVAL 4 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: staff signed in');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, summary, performed_by, created_at)
SELECT @supp_user, 'LOGIN', 'USER', @supp_user,
       'Seed: supplier signed in', 'supplier@medistock.local', DATE_SUB(NOW(), INTERVAL 2 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.summary = 'Seed: supplier signed in');

-- =========================================================
-- VERIFICATION: counts per original demo account
-- =========================================================

SELECT 'old-role demo data' AS section;
SELECT 'admin@' AS login, COUNT(*) AS audit_rows FROM audit_logs WHERE performed_by = 'admin@medistock.local'
UNION ALL SELECT 'pharmacist@', COUNT(*) FROM audit_logs WHERE performed_by = 'pharmacist@medistock.local'
UNION ALL SELECT 'staff@', COUNT(*) FROM audit_logs WHERE performed_by = 'staff@medistock.local'
UNION ALL SELECT 'supplier@', COUNT(*) FROM audit_logs WHERE performed_by = 'supplier@medistock.local';

SELECT u.email,
       (SELECT COUNT(*) FROM purchase_orders p WHERE p.supplier_id = s.supplier_id) AS supplier_pos,
       (SELECT COUNT(*) FROM medicine_returns r WHERE r.supplier_id = s.supplier_id) AS supplier_returns,
       (SELECT COUNT(*) FROM stock_check_reports c WHERE c.reported_by = u.user_id) AS staff_reports,
       (SELECT COUNT(*) FROM notifications n WHERE n.user_id = u.user_id) AS notifications
FROM users u
LEFT JOIN suppliers s ON s.email = u.email
WHERE u.email IN ('admin@medistock.local','pharmacist@medistock.local',
                  'staff@medistock.local','supplier@medistock.local')
ORDER BY u.user_id;
