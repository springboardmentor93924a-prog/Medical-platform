-- MediStock demo seed (idempotent: INSERT IGNORE with fixed IDs)
-- Demo password for every account: Password@123

INSERT IGNORE INTO roles (role_id, role_name) VALUES
    (1, 'ADMIN'),
    (2, 'PHARMACIST'),
    (3, 'STAFF'),
    (4, 'SUPPLIER');

INSERT IGNORE INTO users (user_id, full_name, email, password_hash, role_id, active) VALUES
    (1, 'Admin User',      'admin@medistock.local',      '$2b$10$IygNWkLAgkU1GThBYHDGSuUZtDfOtwbe0pWV29cs2KejcPMBqLPIu', 1, 1),
    (2, 'Pharmacist User', 'pharmacist@medistock.local', '$2b$10$KpHqlsulqVVpOK/0j97c/e5Kz0grOSd5tXjniWK/tBAKRrMYOTA8O', 2, 1),
    (3, 'Staff User',      'staff@medistock.local',      '$2b$10$t1s/yuH7EHNYuin8h74QjONL6HKclVLDKPWKZTJfxHrfn7ku9rVhS', 3, 1),
    (4, 'Supplier User',   'supplier@medistock.local',   '$2b$10$CT1ICbI88HpKKeVV595pe.sq901uxAGbke092u3L3lLS74UAq1sCK', 4, 1);

INSERT IGNORE INTO suppliers (supplier_id, supplier_name, contact_number, email, address, active) VALUES
    (1, 'MedPlus Distributors',  '9000000001', 'orders@medplus.example',  '12 MG Road, Bengaluru',   1),
    (2, 'HealthBridge Supplies', '9000000002', 'sales@healthbridge.example', '45 Park Street, Kolkata', 1),
    (3, 'Apex Pharma Traders',   '9000000003', 'info@apexpharma.example', '78 Anna Salai, Chennai',  1);

INSERT IGNORE INTO medicines (medicine_id, medicine_name, category, description) VALUES
    (1, 'Paracetamol 500mg',  'Analgesic',    'Fever and pain relief tablets'),
    (2, 'Amoxicillin 250mg',  'Antibiotic',   'Broad spectrum antibiotic capsules'),
    (3, 'Cetirizine 10mg',    'Antihistamine', 'Allergy relief tablets'),
    (4, 'Metformin 500mg',    'Antidiabetic', 'Type 2 diabetes management tablets'),
    (5, 'Omeprazole 20mg',    'Gastro',       'Acid reflux capsules'),
    (6, 'Ibuprofen 400mg',    'NSAID',        'Anti-inflammatory tablets'),
    (7, 'Azithromycin 500mg', 'Antibiotic',   'Macrolide antibiotic tablets'),
    (8, 'Vitamin C 500mg',    'Supplement',   'Immunity support tablets');

INSERT IGNORE INTO inventory
    (inventory_id, medicine_id, supplier_id, batch_number, quantity, minimum_stock, unit_price, manufacturing_date, expiry_date) VALUES
    (1, 1, 1, 'PCM-2026-A', 500, 100,  2.50, '2025-01-15', '2027-01-31'),
    (2, 2, 2, 'AMX-2025-B',  40,  50,  8.75, '2025-03-01', '2026-11-10'),
    (3, 3, 1, 'CTZ-2024-C',   0,  25,  1.20, '2024-02-01', '2026-09-01'),
    (4, 4, 3, 'MET-2026-D', 300,  60,  3.40, '2026-01-10', '2028-01-09'),
    (5, 5, 2, 'OMP-2026-E', 220,  50,  5.00, '2026-02-20', '2027-02-19'),
    (6, 6, 3, 'IBU-2025-F',  18,  40,  2.10, '2025-06-01', '2026-12-15'),
    (7, 7, 1, 'AZI-2026-G', 150,  30, 12.00, '2026-03-05', '2027-09-04'),
    (8, 8, 2, 'VTC-2026-H', 600, 100,  0.90, '2026-04-01', '2027-04-01');

INSERT IGNORE INTO purchase_orders
    (purchase_order_id, supplier_id, created_by, order_date, status, total_amount) VALUES
    (1, 1, 1, '2026-10-20 10:15:00', 'PENDING', 430.00);

INSERT IGNORE INTO purchase_order_items
    (item_id, purchase_order_id, medicine_id, quantity, unit_price) VALUES
    (1, 1, 1, 100,  2.50),
    (2, 1, 3,  50,  1.20),
    (3, 1, 7,  10, 12.00);

INSERT IGNORE INTO stock_logs
    (stock_log_id, inventory_id, user_id, change_quantity, movement_type, notes, changed_at) VALUES
    (1, 1, 2,  500, 'IN',  'Initial stock received',        '2026-09-25 09:15:00'),
    (2, 2, 2,  100, 'IN',  'Delivery from HealthBridge',    '2026-09-28 11:40:00'),
    (3, 2, 3,  -60, 'OUT', 'Dispensed to OPD',              '2026-10-05 14:05:00'),
    (4, 3, 2,  -20, 'OUT', 'Expired stock removed',         '2026-10-10 08:30:00'),
    (5, 6, 3,  -12, 'OUT', 'Dispensed to OPD',              '2026-10-18 16:20:00');
