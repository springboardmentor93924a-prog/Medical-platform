-- ==============================================================================
-- MediStock Complete Interconnected Development Seed Script
-- Realistic sample data connecting Admin, Pharmacist, Staff, and Supplier roles
-- Database: medistock (MariaDB / MySQL on port 3307)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TRUNCATE OPERATIONAL TABLES (IDEMPOTENT CLEAN SLATE)
TRUNCATE TABLE goods_receipt_items;
TRUNCATE TABLE goods_receipts;
TRUNCATE TABLE stock_logs;
TRUNCATE TABLE stock_discrepancies;
TRUNCATE TABLE stock_adjustments;
TRUNCATE TABLE purchase_order_items;
TRUNCATE TABLE purchase_orders;
TRUNCATE TABLE inventory_batches;
TRUNCATE TABLE expiry_tracking;
TRUNCATE TABLE sale_items;
TRUNCATE TABLE sales;
TRUNCATE TABLE tasks;
TRUNCATE TABLE task_comments;
TRUNCATE TABLE notifications;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE reports;
TRUNCATE TABLE fefo_allocations;
TRUNCATE TABLE medicines;
TRUNCATE TABLE categories;
TRUNCATE TABLE suppliers;
TRUNCATE TABLE medicine_manufacturers;

-- 2. USERS (EXACTLY 12 CONNECTED USERS ACROSS ALL ROLES, PASSWORD: password123)
-- Hash: $2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK (password123)
DELETE FROM users WHERE user_id NOT IN (1, 2, 3, 6);

INSERT INTO users (user_id, role_id, full_name, email, username, password_hash, phone, is_active, created_at)
VALUES
(1, 1, 'System Administrator', 'admin@medistock.com', 'admin', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0100', 1, '2026-10-01 08:00:00'),
(2, 2, 'Alex Rivera', 'pharmacist@medistock.com', 'pharmacist', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0101', 1, '2026-10-01 08:00:00'),
(3, 3, 'Nurse Emily Watson', 'staff@medistock.com', 'staff', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0102', 1, '2026-10-01 08:00:00'),
(6, 4, 'Apex Medical Supplies Ltd', 'supplier@medistock.com', 'supplier', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0103', 1, '2026-10-01 08:00:00')
ON DUPLICATE KEY UPDATE 
  full_name = VALUES(full_name),
  email = VALUES(email),
  username = VALUES(username),
  password_hash = VALUES(password_hash),
  role_id = VALUES(role_id),
  is_active = 1;

-- Additional users to reach 12 users total
INSERT INTO users (user_id, role_id, full_name, email, username, password_hash, phone, is_active, created_at)
VALUES
(7, 2, 'Dr. Sarah Chen', 'sarah.chen@medistock.com', 'sarah_chen', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0104', 1, '2026-10-02 09:00:00'),
(8, 2, 'Marcus Vance', 'marcus.vance@medistock.com', 'marcus_vance', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0105', 1, '2026-10-02 09:30:00'),
(9, 3, 'Priya Patel', 'priya.patel@medistock.com', 'priya_patel', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0106', 1, '2026-10-03 10:00:00'),
(10, 3, 'David Kim', 'david.kim@medistock.com', 'david_kim', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0107', 1, '2026-10-03 10:30:00'),
(11, 3, 'Rachel Green', 'rachel.green@medistock.com', 'rachel_green', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0108', 1, '2026-10-04 11:00:00'),
(12, 1, 'James Wilson', 'james.wilson@medistock.com', 'james_wilson', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0109', 1, '2026-10-04 11:30:00'),
(13, 4, 'Apollo Logistics Rep', 'apollo.rep@medistock.com', 'apollo_rep', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0110', 1, '2026-10-05 12:00:00'),
(14, 4, 'Green Cross Dispatch', 'greencross.rep@medistock.com', 'greencross_rep', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', '+1 555-0111', 1, '2026-10-05 12:30:00');

-- 3. CATEGORIES (EXACTLY 12 REQUIRED CATEGORIES)
INSERT INTO categories (category_id, category_name, description, created_at) VALUES
(1, 'Pain Relief', 'Analgesics, antipyretics, and non-steroidal anti-inflammatory drugs (NSAIDs).', '2026-10-01 08:00:00'),
(2, 'Antibiotics', 'Broad-spectrum antibacterial, antimicrobial, and systemic antibiotic agents.', '2026-10-01 08:05:00'),
(3, 'Allergy & Cold', 'Antihistamines, decongestants, cold formulations, and allergy relief medicines.', '2026-10-01 08:10:00'),
(4, 'Digestive Health', 'Proton pump inhibitors, antacids, antiemetics, and gastrointestinal therapeutics.', '2026-10-01 08:15:00'),
(5, 'Vitamins & Supplements', 'Nutritional supplements, essential vitamins, trace minerals, and dietary formulas.', '2026-10-01 08:20:00'),
(6, 'Diabetes Care', 'Oral hypoglycemic agents, insulin formulations, and metabolic stabilizers.', '2026-10-01 08:25:00'),
(7, 'First Aid', 'Topical antiseptics, sterile wound dressings, burns treatment, and emergency supplies.', '2026-10-01 08:30:00'),
(8, 'Cardiovascular', 'Antihypertensives, cholesterol regulators, antiplatelets, and cardiac medications.', '2026-10-01 08:35:00'),
(9, 'Dermatology', 'Topical antifungal, antibacterial, corticosteroid, and skin care formulations.', '2026-10-01 08:40:00'),
(10, 'Eye Care', 'Ophthalmic drops, artificial tears, antibacterial solutions, and ocular lubricants.', '2026-10-01 08:45:00'),
(11, 'Respiratory Care', 'Bronchodilators, inhaled corticosteroids, mucolytics, and asthma inhalers.', '2026-10-01 08:50:00'),
(12, 'General Medicines', 'Common hospital formulations, pediatric syrups, and supportive patient therapeutics.', '2026-10-01 08:55:00');

-- 4. MANUFACTURERS (12 LEADING PHARMA PRODUCERS)
INSERT INTO medicine_manufacturers (manufacturer_id, manufacturer_name, contact_person, phone, email, address, website) VALUES
(1, 'Sun Pharmaceutical Industries Ltd.', 'Rajesh Verma', '+91 22 4324 4324', 'contact@sunpharma.example.com', 'Sun House, Goregaon East, Mumbai, MH', 'https://sunpharma.example.com'),
(2, 'Cipla Ltd.', 'Dr. Ananya Roy', '+91 22 2482 6000', 'info@cipla.example.com', 'Cipla House, Peninsula Business Park, Mumbai, MH', 'https://cipla.example.com'),
(3, 'Dr. Reddy''s Laboratories', 'Kavita Menon', '+91 40 4900 2900', 'support@drreddys.example.com', 'Banjara Hills, Hyderabad, TS', 'https://drreddys.example.com'),
(4, 'Lupin Pharmaceuticals', 'Vikram Malhotra', '+91 22 6640 2222', 'care@lupin.example.com', 'Kalpataru Inspire, Santacruz East, Mumbai, MH', 'https://lupin.example.com'),
(5, 'Aurobindo Pharma', 'Sanjay Reddy', '+91 40 6672 5000', 'info@aurobindo.example.com', 'HITEC City, Madhapur, Hyderabad, TS', 'https://aurobindo.example.com'),
(6, 'Zydus Lifesciences', 'Pranav Patel', '+91 79 4804 0000', 'contact@zyduslife.example.com', 'Zydus Corporate Park, Ahmedabad, GJ', 'https://zyduslife.example.com'),
(7, 'Torrent Pharmaceuticals', 'Amit Singhal', '+91 79 2659 9000', 'info@torrentpharma.example.com', 'Torrent House, Off Ashram Road, Ahmedabad, GJ', 'https://torrentpharma.example.com'),
(8, 'Alkem Laboratories', 'Ritu Saxena', '+91 22 3982 9999', 'contact@alkem.example.com', 'Senapati Bapat Marg, Lower Parel, Mumbai, MH', 'https://alkemlabs.example.com'),
(9, 'Glenmark Pharmaceuticals', 'Gaurav Joshi', '+91 22 4018 9999', 'info@glenmark.example.com', 'Glenmark House, Andheri East, Mumbai, MH', 'https://glenmark.example.com'),
(10, 'Abbott India Ltd.', 'Meera Nambiar', '+91 22 5046 1000', 'care@abbottindia.example.com', 'Godrej BKC, Bandra Kurla Complex, Mumbai, MH', 'https://abbottindia.example.com'),
(11, 'GlaxoSmithKline Pharmaceuticals', 'Arun Krishnan', '+91 22 2495 9595', 'support@gsk.example.com', 'Dr. Annie Besant Road, Worli, Mumbai, MH', 'https://gsk-india.example.com'),
(12, 'Pfizer India Ltd.', 'Deepak Sharma', '+91 22 6693 2000', 'info@pfizerindia.example.com', 'The Capital, BKC, Bandra East, Mumbai, MH', 'https://pfizerindia.example.com');

-- 5. SUPPLIERS (EXACTLY 15 SUPPLIERS, INCLUDING APEX CONNECTED TO SUPPLIER ROLE)
INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active, created_at) VALUES
(1, 'Sri Medical Distributors', 'K. S. Narayanan', '+91 44 2834 1122', 'sri.medical@example.com', '14 Mount Road, Guindy, Chennai, TN', 1, '2026-10-01 08:00:00'),
(2, 'Apollo Medical Supplies', 'Suresh Babu', '+91 40 2345 6789', 'apollo.supplies@example.com', 'Plot 55, Jubilee Hills, Hyderabad, TS', 1, '2026-10-01 08:10:00'),
(3, 'Green Cross Pharmaceuticals', 'Rohan Deshmukh', '+91 22 2654 3210', 'greencross@example.com', '88 Andheri Industrial Estate, Mumbai, MH', 1, '2026-10-01 08:20:00'),
(4, 'HealthCare Distributors', 'Vinay Kumar', '+91 80 4123 4567', 'healthcare.dist@example.com', '210 Brigade Road, Ashok Nagar, Bangalore, KA', 1, '2026-10-01 08:30:00'),
(5, 'MedPlus Wholesale', 'Manish Patil', '+91 20 2567 8901', 'medplus.wholesale@example.com', '45 Shivaji Nagar, FC Road, Pune, MH', 1, '2026-10-01 08:40:00'),
(6, 'Prime Pharma Solutions', 'Chirag Shah', '+91 79 2685 4321', 'prime.pharma@example.com', '12 S.G. Highway, Bodakdev, Ahmedabad, GJ', 1, '2026-10-01 08:50:00'),
(7, 'Southern Medical Agencies', 'Mathew Varghese', '+91 484 239 8765', 'southern.med@example.com', '105 MG Road, Ravipuram, Kochi, KL', 1, '2026-10-01 09:00:00'),
(8, 'LifeCare Distributors', 'Debashis Roy', '+91 33 2289 1234', 'lifecare.dist@example.com', '72 Park Street, Mullick Bazar, Kolkata, WB', 1, '2026-10-01 09:10:00'),
(9, 'City Pharma Suppliers', 'Harpreet Singh', '+91 11 2327 5432', 'city.pharma@example.com', '34 Daryaganj, New Delhi, DL', 1, '2026-10-01 09:20:00'),
(10, 'Universal Drug House', 'Rameshwar Meena', '+91 141 236 7890', 'universal.drug@example.com', '18 MI Road, Jayanti Market, Jaipur, RJ', 1, '2026-10-01 09:30:00'),
(11, 'Apex Medical Supplies Ltd', 'Jennifer White', '+1 555-0103', 'supplier@medistock.com', '60 Logistics Park, Central Receiving Dock B, Mumbai, MH', 1, '2026-10-01 09:40:00'),
(12, 'Zenith Healthcare Supplies', 'Gurpreet Kaur', '+91 172 265 4321', 'zenith.health@example.com', 'Plot 4, Industrial Area Phase 1, Chandigarh, CH', 1, '2026-10-01 09:50:00'),
(13, 'Global Pharma Logistics', 'Alok Srivastava', '+91 522 220 9876', 'global.pharma@example.com', '5 Hazratganj, Ashok Marg, Lucknow, UP', 1, '2026-10-01 10:00:00'),
(14, 'Metro Medical Supplies', 'Nitin Agrawal', '+91 731 254 3210', 'metro.medical@example.com', '82 Race Course Road, Indore, MP', 1, '2026-10-01 10:10:00'),
(15, 'Sunrise Pharmaceuticals', 'Pravin Solanki', '+91 261 245 6789', 'sunrise.pharma@example.com', '99 Ring Road, Varachha, Surat, GJ', 1, '2026-10-01 10:20:00');

-- 6. MEDICINES (56 CLINICAL FORMULATIONS ACROSS 12 CATEGORIES)
INSERT INTO medicines (medicine_id, category_id, manufacturer_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
-- Category 1: Pain Relief
(1, 1, 1, 'Paracetamol 500mg', 'Crocin', 'Paracetamol', '500mg', 'Tablet', 'Analgesic and antipyretic for mild to moderate pain and fever.'),
(2, 1, 2, 'Ibuprofen 400mg', 'Brufen', 'Ibuprofen', '400mg', 'Tablet', 'Non-steroidal anti-inflammatory drug for pain, swelling and inflammation.'),
(3, 1, 3, 'Dolo 650mg', 'Dolo-650', 'Paracetamol', '650mg', 'Tablet', 'High-strength antipyretic for persistent fever and severe body pain.'),
(4, 1, 7, 'Diclofenac Sodium 50mg', 'Voveran', 'Diclofenac Sodium', '50mg', 'Tablet', 'NSAID for musculoskeletal pain, osteoarthritis and post-operative pain.'),
(5, 1, 4, 'Tramadol HCl 50mg', 'Tramazac', 'Tramadol Hydrochloride', '50mg', 'Capsule', 'Opioid analgesic for moderate to severe acute clinical pain.'),
(6, 1, 8, 'Aceclofenac 100mg', 'Hifenac', 'Aceclofenac', '100mg', 'Tablet', 'Anti-inflammatory agent indicated for rheumatoid arthritis and ankylosing spondylitis.'),

-- Category 2: Antibiotics
(7, 2, 2, 'Amoxicillin 500mg', 'Novamox', 'Amoxicillin Trihydrate', '500mg', 'Capsule', 'Penicillin-class antibiotic for ear, throat, urinary and chest infections.'),
(8, 2, 3, 'Azithromycin 500mg', 'Azee', 'Azithromycin', '500mg', 'Tablet', 'Macrolide antibiotic for respiratory tract and soft tissue bacterial infections.'),
(9, 2, 5, 'Ciprofloxacin 500mg', 'Ciplox', 'Ciprofloxacin', '500mg', 'Tablet', 'Fluoroquinolone antibiotic for urinary tract, skin and intra-abdominal infections.'),
(10, 2, 1, 'Doxycycline 100mg', 'Doxicip', 'Doxycycline Hyclate', '100mg', 'Capsule', 'Tetracycline antibiotic for dental, acne, respiratory and tick-borne infections.'),
(11, 2, 8, 'Ceftriaxone 1g Injection', 'Monocef', 'Ceftriaxone Sodium', '1g', 'Injection', 'Broad-spectrum cephalosporin for severe hospital-acquired systemic bacterial infections.'),
(12, 2, 7, 'Cefixime 200mg', 'Taxim-O', 'Cefixime', '200mg', 'Tablet', 'Oral cephalosporin for acute bronchitis, typhoid fever and gonorrhea.'),
(13, 2, 10, 'Clarithromycin 500mg', 'Claribid', 'Clarithromycin', '500mg', 'Tablet', 'Macrolide indicated for pneumonia, pharyngitis and H. pylori eradication.'),

-- Category 3: Allergy & Cold
(14, 3, 2, 'Cetirizine 10mg', 'Cetzine', 'Cetirizine Hydrochloride', '10mg', 'Tablet', 'Second-generation antihistamine for seasonal allergic rhinitis, sneezing and urticaria.'),
(15, 3, 3, 'Levocetirizine 5mg', 'Levocet', 'Levocetirizine Dihydrochloride', '5mg', 'Tablet', 'Non-sedating antihistamine for long-term chronic perennial allergic rhinitis.'),
(16, 3, 6, 'Fexofenadine 120mg', 'Allegra', 'Fexofenadine Hydrochloride', '120mg', 'Tablet', 'Fast-acting anti-allergy formula for hay fever and chronic idiopathic skin allergies.'),
(17, 3, 1, 'Montelukast 10mg', 'Montair', 'Montelukast Sodium', '10mg', 'Tablet', 'Leukotriene receptor antagonist for prophylaxis of asthma and allergic rhinitis.'),
(18, 3, 11, 'Chlorpheniramine Maleate 4mg', 'Piriton', 'Chlorpheniramine Maleate', '4mg', 'Tablet', 'Classic antihistamine for acute allergic reactions, insect bites and hives.'),

-- Category 4: Digestive Health
(19, 4, 3, 'Omeprazole 20mg', 'Omez', 'Omeprazole', '20mg', 'Capsule', 'Proton pump inhibitor for gastroesophageal reflux disease (GERD) and peptic ulcers.'),
(20, 4, 1, 'Pantoprazole 40mg', 'Pan-40', 'Pantoprazole Sodium', '40mg', 'Tablet', 'Gastric acid secretion inhibitor for erosive esophagitis and Zollinger-Ellison syndrome.'),
(21, 4, 11, 'Ranitidine 150mg', 'Rantac', 'Ranitidine Hydrochloride', '150mg', 'Tablet', 'H2 receptor blocker for heartburn, indigestion and acid dyspepsia.'),
(22, 4, 7, 'Domperidone 10mg', 'Vomistop', 'Domperidone', '10mg', 'Tablet', 'Dopamine antagonist antiemetic for nausea, vomiting and upper GI motility disorders.'),
(23, 4, 1, 'Esomeprazole 40mg', 'Nexpro', 'Esomeprazole Magnesium', '40mg', 'Tablet', 'S-isomer of omeprazole for severe acid reflux and prevention of NSAID-induced ulcers.'),
(24, 4, 2, 'Ondansetron 4mg', 'Emeset', 'Ondansetron Hydrochloride', '4mg', 'Tablet', '5-HT3 receptor antagonist preventing chemotherapy and post-operative nausea.'),
(25, 4, 10, 'Loperamide 2mg', 'Imodium', 'Loperamide Hydrochloride', '2mg', 'Capsule', 'Antidiarrheal agent slowing bowel motility in acute and chronic diarrhea.'),

-- Category 5: Vitamins & Supplements
(26, 5, 10, 'Vitamin C 500mg', 'Limcee', 'Ascorbic Acid', '500mg', 'Chewable Tablet', 'Immune support antioxidant and nutritional supplement preventing scurvy.'),
(27, 5, 6, 'Vitamin D3 60000 IU', 'D-Rise', 'Cholecalciferol', '60,000 IU', 'Capsule', 'High-dose fat-soluble vitamin for severe hypocalcemia and bone density maintenance.'),
(28, 5, 10, 'Calcium 500mg + D3', 'Shelcal', 'Calcium Carbonate + Cholecalciferol', '500mg/250IU', 'Tablet', 'Mineral supplement for osteoporosis prevention, post-menopausal care and bone health.'),
(29, 5, 11, 'B-Complex with Zinc', 'Becozinc', 'Vitamin B-Complex with Zinc', 'Standard', 'Capsule', 'Therapeutic formulation for mouth ulcers, fatigue, neuropathies and convalescence.'),
(30, 5, 5, 'Folic Acid 5mg', 'Folvite', 'Folic Acid', '5mg', 'Tablet', 'Water-soluble B vitamin essential during pregnancy and megaloblastic anemia treatment.'),
(31, 5, 4, 'Iron & Folic Acid 100mg', 'Autrin', 'Ferrous Fumarate + Folic Acid', '100mg', 'Capsule', 'Hematopoietic formula indicated for nutritional iron-deficiency anemia.'),
(32, 5, 8, 'Zinc Sulfate 20mg', 'Zincovit', 'Zinc Sulfate Monohydrate', '20mg', 'Tablet', 'Essential trace element promoting wound healing, immune defense and pediatric diarrhea recovery.'),

-- Category 6: Diabetes Care
(33, 6, 1, 'Metformin 500mg', 'Glycomet', 'Metformin Hydrochloride', '500mg', 'Tablet', 'First-line biguanide antihyperglycemic for type 2 diabetes mellitus.'),
(34, 6, 7, 'Glimepiride 2mg', 'Amaryl', 'Glimepiride', '2mg', 'Tablet', 'Second-generation sulfonylurea stimulating pancreatic beta-cell insulin secretion.'),
(35, 6, 9, 'Teneligliptin 20mg', 'Ziten', 'Teneligliptin Hydrobromide', '20mg', 'Tablet', 'DPP-4 inhibitor enhancing incretin hormones for glycemic control.'),
(36, 6, 1, 'Dapagliflozin 10mg', 'Oxra', 'Dapagliflozin', '10mg', 'Tablet', 'SGLT2 inhibitor reducing blood glucose via urinary excretion, with cardioprotective benefits.'),
(37, 6, 4, 'Vildagliptin 50mg', 'Galvus', 'Vildagliptin', '50mg', 'Tablet', 'Incretin enhancer for adult type 2 diabetes in monotherapy or dual combination.'),
(38, 6, 10, 'Insulin Regular 100IU/ml', 'Actrapid', 'Human Regular Insulin', '100 IU/ml', 'Vial 10ml', 'Short-acting human insulin for glycemic management in emergency and surgical wards.'),

-- Category 7: First Aid
(39, 7, 2, 'ORS Sachet 21.8g', 'Electral', 'Oral Rehydration Salts IP', '21.8g', 'Sachet', 'WHO-recommended electrolyte powder preventing severe dehydration.'),
(40, 7, 2, 'Povidone Iodine 5% Ointment', 'Betadine', 'Povidone Iodine', '5% w/w', 'Tube 20g', 'Antiseptic microbicide for lacerations, surgical wounds, abrasions and minor burns.'),
(41, 7, 1, 'Silver Sulfadiazine 1% Cream', 'Silverex', 'Silver Sulfadiazine', '1% w/w', 'Tube 30g', 'Topical antimicrobial agent for prevention and treatment of sepsis in 2nd/3rd degree burns.'),
(42, 7, 8, 'Hydrogen Peroxide 3% 100ml', 'Peroxide Solution', 'Hydrogen Peroxide Solution', '3% v/v', 'Bottle 100ml', 'Effervescent cleansing antiseptic debriding dirty or necrotic superficial wounds.'),
(43, 7, 12, 'Sterile Roller Bandage', 'Mediband', 'Bleached Cotton Bandage', '10cm x 4m', 'Roll', 'Medical-grade conforming bandage for surgical dressing retention and limb support.'),

-- Category 8: Cardiovascular
(44, 8, 3, 'Amlodipine 5mg', 'Stamlo', 'Amlodipine Besylate', '5mg', 'Tablet', 'Dihydropyridine calcium channel blocker for systemic arterial hypertension and stable angina.'),
(45, 8, 1, 'Atorvastatin 20mg', 'Atorva', 'Atorvastatin Calcium', '20mg', 'Tablet', 'HMG-CoA reductase inhibitor lowering LDL cholesterol and preventing ischemic coronary events.'),
(46, 8, 9, 'Telmisartan 40mg', 'Telma', 'Telmisartan', '40mg', 'Tablet', 'Angiotensin II receptor antagonist (ARB) for long-acting hypertension management.'),
(47, 8, 7, 'Losartan Potassium 50mg', 'Losacar', 'Losartan Potassium', '50mg', 'Tablet', 'Renoprotective ARB indicated in hypertensive patients with type 2 diabetes and nephropathy.'),
(48, 8, 7, 'Clopidogrel 75mg', 'Clopilet', 'Clopidogrel Bisulfate', '75mg', 'Tablet', 'P2Y12 platelet inhibitor preventing thrombotic cerebrovascular and cardiovascular events.'),
(49, 8, 1, 'Rosuvastatin 10mg', 'Rozavel', 'Rosuvastatin Calcium', '10mg', 'Tablet', 'Synthetic statin offering potent lipid-lowering efficacy in severe hypercholesterolemia.'),
(50, 8, 5, 'Metoprolol Tartrate 50mg', 'Betaloc', 'Metoprolol Tartrate', '50mg', 'Tablet', 'Cardioselective beta-1 blocker for tachyarrhythmias, angina pectoris and hypertension.'),

-- Category 9: Dermatology
(51, 9, 9, 'Clotrimazole 1% Cream', 'Candid', 'Clotrimazole', '1% w/w', 'Tube 30g', 'Broad-spectrum imidazole antifungal for tinea pedis, ringworm, candidiasis and jock itch.'),
(52, 9, 11, 'Betamethasone 0.1% Cream', 'Betnovate', 'Betamethasone Valerate', '0.1% w/w', 'Tube 20g', 'Potent topical corticosteroid reducing pruritus and inflammation in severe eczema and psoriasis.'),

-- Category 10: Eye Care
(53, 10, 1, 'Carboxymethylcellulose 0.5% Drops', 'Refresh Tears', 'Carboxymethylcellulose Sodium', '0.5% w/v', 'Dropper 10ml', 'Preservative-free artificial tears soothing dry, burning, irritated post-operative eyes.'),
(54, 10, 2, 'Moxifloxacin 0.5% Eye Drops', 'Moxicip', 'Moxifloxacin Hydrochloride', '0.5% w/v', 'Dropper 5ml', '4th-generation fluoroquinolone ophthalmic solution for acute bacterial conjunctivitis.'),

-- Category 11: Respiratory Care
(55, 11, 2, 'Salbutamol Inhaler 100mcg', 'Asthalin', 'Salbutamol Sulfate', '100mcg/dose', 'Inhaler 200 doses', 'Short-acting beta-2 agonist bronchodilator for acute relief of asthma bronchospasms.'),
(56, 11, 2, 'Budesonide 200mcg Inhaler', 'Budecort', 'Budesonide', '200mcg/dose', 'Inhaler 200 doses', 'Inhaled maintenance corticosteroid for long-term clinical prevention of chronic asthma attacks.');

-- 7. INVENTORY BATCHES (75 INTERCONNECTED REALISTIC BATCHES)
-- Batch spread:
-- 4 Expired (past date, available for quarantine testing)
-- 4 Expiring <= 7 days (Nov 10-13, 2026)
-- 6 Expiring <= 30 days (Nov 20 - Dec 05, 2026)
-- 5 Expiring <= 60 days (Dec 15, 2026 - Jan 04, 2027)
-- 4 Expiring <= 90 days (Jan 15 - Feb 03, 2027)
-- Low stock batches (qty <= 20)
-- 52 Normal safe batches (2027 - 2028)
INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price, created_at) VALUES
-- Expired batches (for testing Quarantine protocols)
(1, 1, 11, 'BAT-PAR-202401', '2024-08-10', '2026-08-15', 500, 15, 3.50, 7.00, '2026-08-15 08:00:00'),
(2, 7, 3,  'BAT-AMX-202402', '2024-09-15', '2026-09-30', 300, 25, 8.00, 15.00, '2026-09-30 08:00:00'),
(3, 19, 2, 'BAT-OMP-202403', '2024-10-10', '2026-10-15', 400, 10, 5.00, 11.00, '2026-10-15 08:00:00'),
(4, 14, 5, 'BAT-CET-202404', '2024-10-20', '2026-10-25', 600, 18, 2.50, 5.50, '2026-10-25 08:00:00'),

-- Expiring <= 7 Days (Critical alerts)
(5, 3, 11, 'BAT-DOL-202405', '2025-01-10', '2026-11-10', 400, 40, 4.00, 8.50, '2026-01-10 09:00:00'),
(6, 8, 2,  'BAT-AZI-202406', '2025-02-15', '2026-11-12', 200, 12, 14.00, 26.00, '2026-02-15 09:00:00'),
(7, 20, 1, 'BAT-PAN-202407', '2025-01-20', '2026-11-11', 350, 35, 6.00, 13.00, '2026-01-20 09:00:00'),
(8, 2, 4,  'BAT-IBU-202408', '2025-01-25', '2026-11-13', 250, 18, 4.50, 9.00, '2026-01-25 09:00:00'),

-- Expiring <= 30 Days (Near expiry alerts)
(9, 33, 11, 'BAT-MET-202409', '2025-02-01', '2026-11-20', 500, 50, 3.00, 7.00, '2026-02-01 10:00:00'),
(10, 26, 6, 'BAT-VTC-202410', '2025-02-10', '2026-11-25', 300, 28, 4.00, 9.00, '2026-02-10 10:00:00'),
(11, 44, 2, 'BAT-AML-202411', '2025-02-15', '2026-11-28', 250, 25, 5.00, 11.00, '2026-02-15 10:00:00'),
(12, 39, 11, 'BAT-ORS-202412', '2025-03-01', '2026-12-02', 600, 60, 1.50, 3.50, '2026-03-01 10:00:00'),
(13, 9, 3,  'BAT-CIP-202413', '2025-03-05', '2026-12-04', 200, 22, 7.00, 14.50, '2026-03-05 10:00:00'),
(14, 15, 1, 'BAT-LEV-202414', '2025-03-10', '2026-12-05', 250, 18, 3.50, 8.00, '2026-03-10 10:00:00'),

-- Expiring <= 60 Days
(15, 21, 5, 'BAT-RAN-202415', '2025-03-15', '2026-12-15', 300, 45, 2.50, 6.00, '2026-03-15 11:00:00'),
(16, 27, 2, 'BAT-VTD-202416', '2025-03-20', '2026-12-20', 200, 35, 12.00, 24.00, '2026-03-20 11:00:00'),
(17, 34, 11, 'BAT-GLI-202417', '2025-03-25', '2026-12-28', 250, 28, 5.00, 11.50, '2026-03-25 11:00:00'),
(18, 40, 7, 'BAT-POV-202418', '2025-04-01', '2027-01-02', 300, 40, 6.50, 14.00, '2026-04-01 11:00:00'),
(19, 45, 1, 'BAT-ATO-202419', '2025-04-05', '2027-01-04', 350, 30, 8.00, 18.00, '2026-04-05 11:00:00'),

-- Expiring <= 90 Days
(20, 46, 4, 'BAT-TEL-202420', '2025-04-10', '2027-01-15', 400, 65, 7.50, 16.00, '2026-04-10 12:00:00'),
(21, 51, 8, 'BAT-CLO-202421', '2025-04-15', '2027-01-22', 250, 50, 4.50, 10.00, '2026-04-15 12:00:00'),
(22, 55, 2, 'BAT-SAL-202422', '2025-04-20', '2027-01-28', 150, 30, 15.00, 32.00, '2026-04-20 12:00:00'),
(23, 54, 11, 'BAT-MOX-202423', '2025-04-25', '2027-02-02', 200, 45, 9.00, 20.00, '2026-04-25 12:00:00'),

-- Low Stock items (triggering Low-Stock cards & alerts)
(24, 1, 11, 'BAT-PAR-202501', '2025-06-01', '2027-08-01', 300, 8, 3.60, 7.00, '2026-06-01 08:00:00'),
(25, 7, 3,  'BAT-AMX-202502', '2025-06-05', '2027-09-01', 250, 12, 8.20, 15.00, '2026-06-05 08:00:00'),
(26, 45, 1, 'BAT-ATO-202503', '2025-06-10', '2027-09-15', 200, 5, 8.10, 18.00, '2026-06-10 08:00:00'),
(27, 19, 2, 'BAT-OMP-202504', '2025-06-15', '2027-10-01', 300, 14, 5.10, 11.00, '2026-06-15 08:00:00'),
(28, 11, 8, 'BAT-CFT-202505', '2025-06-20', '2027-07-20', 100, 6, 25.00, 48.00, '2026-06-20 08:00:00'),
(29, 38, 10, 'BAT-INS-202506', '2025-07-01', '2027-06-01', 80, 4, 45.00, 85.00, '2026-07-01 08:00:00'),

-- Healthy Clinical Inventory Batches (2027 - 2028 Expiry)
(30, 1, 11, 'BAT-PAR-202507', '2026-01-10', '2028-01-10', 1000, 650, 3.50, 7.00, '2026-01-10 09:00:00'),
(31, 2, 4,  'BAT-IBU-202508', '2026-01-15', '2028-01-15', 800, 520, 4.40, 9.00, '2026-01-15 09:00:00'),
(32, 3, 11, 'BAT-DOL-202509', '2026-01-20', '2028-02-01', 1200, 850, 4.00, 8.50, '2026-01-20 09:00:00'),
(33, 4, 7,  'BAT-DIC-202510', '2026-02-01', '2028-02-15', 600, 410, 3.80, 8.00, '2026-02-01 09:00:00'),
(34, 5, 4,  'BAT-TRA-202511', '2026-02-10', '2028-03-01', 400, 260, 7.50, 16.00, '2026-02-10 09:00:00'),
(35, 6, 8,  'BAT-ACE-202512', '2026-02-15', '2028-03-15', 500, 320, 5.00, 11.00, '2026-02-15 09:00:00'),
(36, 7, 3,  'BAT-AMX-202513', '2026-02-20', '2028-02-20', 1500, 950, 8.00, 15.00, '2026-02-20 09:00:00'),
(37, 8, 2,  'BAT-AZI-202514', '2026-03-01', '2028-03-01', 800, 480, 14.00, 26.00, '2026-03-01 09:00:00'),
(38, 9, 5,  'BAT-CIP-202515', '2026-03-05', '2028-03-10', 700, 410, 7.00, 14.50, '2026-03-05 09:00:00'),
(39, 10, 1, 'BAT-DOX-202516', '2026-03-10', '2028-03-20', 500, 340, 5.50, 12.00, '2026-03-10 09:00:00'),
(40, 11, 8, 'BAT-CFT-202517', '2026-03-15', '2028-04-01', 400, 280, 25.00, 48.00, '2026-03-15 09:00:00'),
(41, 12, 7, 'BAT-CFX-202518', '2026-03-20', '2028-04-10', 600, 390, 11.00, 22.00, '2026-03-20 09:00:00'),
(42, 13, 10, 'BAT-CLA-202519', '2026-03-25', '2028-04-20', 350, 220, 18.00, 35.00, '2026-03-25 09:00:00'),
(43, 14, 2, 'BAT-CET-202520', '2026-04-01', '2028-05-01', 1200, 820, 2.40, 5.50, '2026-04-01 10:00:00'),
(44, 15, 3, 'BAT-LEV-202521', '2026-04-05', '2028-05-10', 900, 610, 3.40, 8.00, '2026-04-05 10:00:00'),
(45, 16, 6, 'BAT-FEX-202522', '2026-04-10', '2028-05-20', 600, 420, 8.50, 18.00, '2026-04-10 10:00:00'),
(46, 17, 1, 'BAT-MON-202523', '2026-04-15', '2028-06-01', 750, 530, 9.00, 19.50, '2026-04-15 10:00:00'),
(47, 18, 11, 'BAT-CPM-202524', '2026-04-20', '2028-06-15', 1000, 710, 1.20, 3.00, '2026-04-20 10:00:00'),
(48, 19, 3, 'BAT-OME-202525', '2026-05-01', '2028-07-01', 1100, 780, 5.00, 11.00, '2026-05-01 10:00:00'),
(49, 20, 1, 'BAT-PAN-202526', '2026-05-05', '2028-07-10', 1400, 980, 6.00, 13.00, '2026-05-05 10:00:00'),
(50, 21, 5, 'BAT-RAN-202527', '2026-05-10', '2028-08-01', 800, 540, 2.50, 6.00, '2026-05-10 10:00:00'),
(51, 22, 7, 'BAT-DOM-202528', '2026-05-15', '2028-08-15', 600, 430, 3.20, 7.50, '2026-05-15 10:00:00'),
(52, 23, 1, 'BAT-ESO-202529', '2026-05-20', '2028-09-01', 500, 360, 8.00, 17.50, '2026-05-20 10:00:00'),
(53, 24, 2, 'BAT-OND-202530', '2026-06-01', '2028-09-10', 700, 490, 4.00, 9.50, '2026-06-01 11:00:00'),
(54, 25, 10, 'BAT-LOP-202531', '2026-06-05', '2028-10-01', 400, 280, 2.00, 5.00, '2026-06-05 11:00:00'),
(55, 26, 10, 'BAT-VTC-202532', '2026-06-10', '2028-10-15', 1500, 1100, 3.80, 9.00, '2026-06-10 11:00:00'),
(56, 27, 6, 'BAT-VTD-202533', '2026-06-15', '2028-11-01', 800, 590, 12.00, 24.00, '2026-06-15 11:00:00'),
(57, 28, 10, 'BAT-CAL-202534', '2026-06-20', '2028-11-15', 1000, 740, 5.50, 12.00, '2026-06-20 11:00:00'),
(58, 29, 11, 'BAT-BCZ-202535', '2026-07-01', '2028-12-01', 900, 680, 4.20, 9.50, '2026-07-01 11:00:00'),
(59, 30, 5, 'BAT-FOL-202536', '2026-07-05', '2028-12-10', 600, 430, 2.00, 4.80, '2026-07-05 11:00:00'),
(60, 31, 4, 'BAT-IRN-202537', '2026-07-10', '2029-01-01', 750, 520, 6.00, 13.50, '2026-07-10 11:00:00'),
(61, 32, 8, 'BAT-ZNC-202538', '2026-07-15', '2029-01-15', 500, 360, 3.00, 7.00, '2026-07-15 11:00:00'),
(62, 33, 1, 'BAT-MET-202539', '2026-08-01', '2029-02-01', 1800, 1350, 3.00, 7.00, '2026-08-01 12:00:00'),
(63, 34, 7, 'BAT-GLM-202540', '2026-08-05', '2029-02-15', 700, 510, 5.00, 11.50, '2026-08-05 12:00:00'),
(64, 35, 9, 'BAT-TEN-202541', '2026-08-10', '2029-03-01', 500, 380, 9.00, 19.00, '2026-08-10 12:00:00'),
(65, 36, 1, 'BAT-DAP-202542', '2026-08-15', '2029-03-15', 600, 440, 15.00, 31.00, '2026-08-15 12:00:00'),
(66, 37, 4, 'BAT-VIL-202543', '2026-08-20', '2029-04-01', 450, 320, 12.00, 25.00, '2026-08-20 12:00:00'),
(67, 38, 10, 'BAT-INS-202544', '2026-09-01', '2028-09-01', 300, 210, 45.00, 85.00, '2026-09-01 12:00:00'),
(68, 39, 2, 'BAT-ORS-202545', '2026-09-05', '2029-05-01', 2000, 1550, 1.50, 3.50, '2026-09-05 12:00:00'),
(69, 40, 2, 'BAT-PVD-202546', '2026-09-10', '2029-05-15', 800, 610, 6.50, 14.00, '2026-09-10 12:00:00'),
(70, 41, 1, 'BAT-SLV-202547', '2026-09-15', '2029-06-01', 500, 390, 8.00, 17.00, '2026-09-15 12:00:00'),
(71, 44, 3, 'BAT-AML-202548', '2026-09-20', '2029-06-15', 1200, 890, 5.00, 11.00, '2026-09-20 12:00:00'),
(72, 45, 1, 'BAT-ATV-202549', '2026-10-01', '2029-07-01', 1000, 750, 8.00, 18.00, '2026-10-01 13:00:00'),
(73, 46, 9, 'BAT-TEL-202550', '2026-10-05', '2029-07-15', 900, 670, 7.50, 16.00, '2026-10-05 13:00:00'),
(74, 53, 1, 'BAT-CMC-202551', '2026-10-10', '2028-10-10', 400, 310, 6.00, 13.50, '2026-10-10 13:00:00'),
(75, 55, 2, 'BAT-SAL-202552', '2026-10-15', '2028-10-15', 500, 380, 15.00, 32.00, '2026-10-15 13:00:00');

-- 8. PURCHASE ORDERS (32 REALISTIC REQUISITIONS WITH CROSS-ROLE STATUSES)
INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes, rejection_reason, approval_notes, created_at) VALUES
-- Pending Approval (Pharmacist submitted, waiting for Admin review)
(1, 1,  2, '2026-11-04', '2026-11-12', 'PENDING_APPROVAL', 2450.00, 'Emergency buffer replenishment for outpatient clinic.', NULL, NULL, '2026-11-04 09:15:00'),
(2, 2,  2, '2026-11-04', '2026-11-14', 'PENDING_APPROVAL', 5120.00, 'High-demand antibiotic and respiratory inhaler stock.', NULL, NULL, '2026-11-04 10:30:00'),
(3, 3,  7, '2026-11-05', '2026-11-15', 'PENDING_APPROVAL', 3800.00, 'Antihistamine and cold formulation replenishment.', NULL, NULL, '2026-11-05 11:00:00'),
(4, 11, 2, '2026-11-05', '2026-11-16', 'PENDING_APPROVAL', 4650.00, 'Contracted scheduled order via Apex Medical portal.', NULL, NULL, '2026-11-05 14:20:00'),

-- Approved (Admin approved, awaiting vendor dispatch)
(5, 11, 2, '2026-11-01', '2026-11-10', 'APPROVED', 6200.00, 'Quarterly core chronic cardiovascular replenishment.', NULL, 'Approved by Admin for clinical quota dispatch.', '2026-11-01 08:30:00'),
(6, 2,  2, '2026-11-01', '2026-11-11', 'APPROVED', 4100.00, 'First aid emergency wound dressings and ORS.', NULL, 'Approved for critical inventory floor balance.', '2026-11-01 09:00:00'),
(7, 4,  7, '2026-11-02', '2026-11-12', 'APPROVED', 3250.00, 'Analgesic hospital tablet inventory boost.', NULL, 'Approved per department budget clearance.', '2026-11-02 10:15:00'),
(8, 6,  2, '2026-11-02', '2026-11-14', 'APPROVED', 8400.00, 'Vitamin and micronutrient therapeutic bulk pack.', NULL, 'Approved for winter nutrition protocol.', '2026-11-02 11:45:00'),
(9, 5,  8, '2026-11-03', '2026-11-15', 'APPROVED', 2900.00, 'Gastric acid suppressants and antacids.', NULL, 'Approved for general ward stocking.', '2026-11-03 13:00:00'),
(10, 8, 2, '2026-11-03', '2026-11-16', 'APPROVED', 5500.00, 'Injectable antibiotic emergency store quota.', NULL, 'Approved per medical superintendent directive.', '2026-11-03 15:30:00'),

-- Ordered / In Transit / Shipped (Supplier dispatched, arriving at dock)
(11, 11, 2, '2026-10-28', '2026-11-07', 'IN_TRANSIT', 7800.00, 'Cold chain diabetes insulin & oral agents.', NULL, 'Approved by Admin', '2026-10-28 09:00:00'),
(12, 3,  2, '2026-10-29', '2026-11-08', 'IN_TRANSIT', 4400.00, 'Broad-spectrum cephalosporins and macrolides.', NULL, 'Approved by Admin', '2026-10-29 10:00:00'),
(13, 7,  7, '2026-10-30', '2026-11-08', 'IN_TRANSIT', 3900.00, 'Cardiovascular ACE inhibitors and statins.', NULL, 'Approved by Admin', '2026-10-30 11:00:00'),
(14, 9,  2, '2026-10-30', '2026-11-09', 'IN_TRANSIT', 6100.00, 'Emergency pediatric and surgical syrups.', NULL, 'Approved by Admin', '2026-10-30 14:00:00'),
(15, 10, 8, '2026-10-31', '2026-11-09', 'IN_TRANSIT', 5250.00, 'Ophthalmic eye drops and antiseptic ointments.', NULL, 'Approved by Admin', '2026-10-31 16:00:00'),

-- Partially Received (Staff verified first shipment consignment)
(16, 1,  2, '2026-10-20', '2026-10-29', 'PARTIALLY_RECEIVED', 8900.00, 'Large consignment paracetamol & antibiotic tablets.', NULL, 'Approved by Admin', '2026-10-20 09:30:00'),
(17, 11, 2, '2026-10-22', '2026-10-31', 'PARTIALLY_RECEIVED', 10500.00, 'Apex bulk order: Atorvastatin, Metformin, Dolo.', NULL, 'Approved by Admin', '2026-10-22 11:00:00'),
(18, 2,  7, '2026-10-24', '2026-11-02', 'PARTIALLY_RECEIVED', 6750.00, 'Apollo surgical dressings and topical creams.', NULL, 'Approved by Admin', '2026-10-24 14:00:00'),

-- Received / Completed (Staff fully verified, inventory credited)
(19, 11, 2, '2026-10-02', '2026-10-09', 'RECEIVED', 7450.00, 'Monthly Apex chronic medicine supply.', NULL, 'Approved by Admin', '2026-10-02 08:30:00'),
(20, 2,  2, '2026-10-04', '2026-10-11', 'RECEIVED', 4800.00, 'Pediatric oral antibiotics and inhalers.', NULL, 'Approved by Admin', '2026-10-04 09:00:00'),
(21, 3,  8, '2026-10-06', '2026-10-13', 'RECEIVED', 3600.00, 'Routine allergy relief tablets.', NULL, 'Approved by Admin', '2026-10-06 10:15:00'),
(22, 4,  2, '2026-10-08', '2026-10-15', 'RECEIVED', 5200.00, 'Inpatient analgesics and antipyretics.', NULL, 'Approved by Admin', '2026-10-08 11:30:00'),
(23, 5,  7, '2026-10-10', '2026-10-17', 'RECEIVED', 6100.00, 'Gastrointestinal PPIs and antiemetics.', NULL, 'Approved by Admin', '2026-10-10 13:45:00'),
(24, 6,  2, '2026-10-12', '2026-10-19', 'RECEIVED', 4900.00, 'Vitamin B-Complex and Calcium supplements.', NULL, 'Approved by Admin', '2026-10-12 15:00:00'),
(25, 7,  2, '2026-10-14', '2026-10-21', 'RECEIVED', 8200.00, 'Hypertension combination therapies.', NULL, 'Approved by Admin', '2026-10-14 16:20:00'),
(26, 8,  8, '2026-10-16', '2026-10-23', 'RECEIVED', 3750.00, 'Hospital first aid emergency supplies.', NULL, 'Approved by Admin', '2026-10-16 09:10:00'),
(27, 9,  2, '2026-10-18', '2026-10-25', 'RECEIVED', 5900.00, 'Dermatology topical antimicrobials.', NULL, 'Approved by Admin', '2026-10-18 11:40:00'),
(28, 11, 2, '2026-10-19', '2026-10-26', 'RECEIVED', 9300.00, 'Apex hospital contract fulfillment.', NULL, 'Approved by Admin', '2026-10-19 14:15:00'),

-- Rejected (Declined by Admin with audit trail reason)
(29, 4,  2, '2026-10-25', '2026-11-03', 'REJECTED', 12500.00, 'Bulk requisition for non-critical pain relief tablets.', 'Budget ceiling exceeded for Q4 pain management quota.', NULL, '2026-10-25 09:00:00'),
(30, 6,  7, '2026-10-26', '2026-11-04', 'REJECTED', 8900.00, 'Surplus vitamin formulation replenishment.', 'Current clinical inventory levels sufficient; reorder threshold not met.', NULL, '2026-10-26 11:30:00'),
(31, 8,  2, '2026-10-27', '2026-11-05', 'REJECTED', 15200.00, 'Imported specialty antibiotic injection request.', 'Unit pricing higher than negotiated regional clinical supply agreement.', NULL, '2026-10-27 14:15:00'),
(32, 12, 8, '2026-10-28', '2026-11-06', 'REJECTED', 6400.00, 'Supplemental first aid consignment.', 'Vendor SLA non-compliance on cold chain transportation guarantee.', NULL, '2026-10-28 16:00:00');

-- 9. PURCHASE ORDER ITEMS (LINKED MEDICINES, QUANTITIES & UNIT COSTS)
-- Note: 'subtotal' is a STORED GENERATED column in MySQL, so we omit it from INSERT.
INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_cost) VALUES
-- PO 1 (Pending: Sri Medical)
(1, 1, 300, 3.50),
(1, 2, 200, 4.50),
(1, 14, 200, 2.50),

-- PO 2 (Pending: Apollo Medical)
(2, 7, 250, 8.00),
(2, 8, 150, 14.00),
(2, 55, 30, 15.00),
(2, 56, 25, 22.80),

-- PO 3 (Pending: Green Cross)
(3, 14, 400, 2.50),
(3, 15, 300, 3.50),
(3, 16, 200, 8.75),

-- PO 4 (Pending: Apex Medical)
(4, 33, 500, 3.00),
(4, 44, 300, 5.00),
(4, 45, 200, 8.25),

-- PO 5 (Approved: Apex Medical)
(5, 45, 400, 8.00),
(5, 46, 400, 7.50),

-- PO 6 (Approved: Apollo Medical)
(6, 39, 1000, 1.50),
(6, 40, 400, 6.50),

-- PO 7 (Approved: HealthCare Dist)
(7, 3, 500, 4.00),
(7, 4, 325, 3.84),

-- PO 8 (Approved: Prime Pharma)
(8, 26, 1000, 3.80),
(8, 27, 300, 12.00),
(8, 28, 200, 5.00),

-- PO 9 (Approved: MedPlus)
(9, 19, 300, 5.00),
(9, 20, 200, 7.00),

-- PO 10 (Approved: LifeCare)
(10, 11, 220, 25.00),

-- PO 11 (In Transit: Apex Medical)
(11, 33, 1000, 3.00),
(11, 38, 60, 45.00),
(11, 45, 250, 8.40),

-- PO 12 (In Transit: Green Cross)
(12, 7, 300, 8.00),
(12, 8, 140, 14.28),

-- PO 13 (In Transit: Southern Medical)
(13, 44, 400, 5.00),
(13, 47, 300, 6.33),

-- PO 14 (In Transit: City Pharma)
(14, 1, 600, 3.50),
(14, 55, 125, 15.00),
(14, 56, 95, 22.36),

-- PO 15 (In Transit: Universal Drug)
(15, 53, 500, 6.00),
(15, 40, 346, 6.50),

-- PO 16 (Partially Received: Sri Medical)
(16, 1, 1000, 3.50),
(16, 7, 600, 8.00),
(16, 19, 120, 5.00),

-- PO 17 (Partially Received: Apex Medical)
(17, 3, 1000, 4.00),
(17, 33, 1100, 3.00),
(17, 45, 400, 8.00),

-- PO 18 (Partially Received: Apollo Medical)
(18, 40, 500, 6.50),
(18, 41, 400, 8.75),

-- PO 19 to 28 (Fully Received Orders)
(19, 1, 1000, 3.50),
(19, 3, 500, 4.00),
(19, 33, 650, 3.00),

(20, 7, 350, 8.00),
(20, 55, 100, 15.00),
(20, 56, 22, 22.72),

(21, 14, 800, 2.50),
(21, 15, 400, 4.00),

(22, 2, 600, 4.50),
(22, 4, 650, 3.84),

(23, 19, 600, 5.00),
(23, 20, 400, 7.75),

(24, 26, 800, 3.80),
(24, 28, 350, 5.31),

(25, 44, 800, 5.00),
(25, 45, 525, 8.00),

(26, 39, 1500, 1.50),
(26, 43, 300, 5.00),

(27, 51, 600, 4.50),
(27, 52, 400, 8.00),

(28, 33, 1200, 3.00),
(28, 45, 500, 8.00),
(28, 46, 225, 7.55),

-- Rejected Orders
(29, 2, 1500, 4.50),
(29, 1, 1600, 3.59),

(30, 26, 1200, 3.80),
(30, 27, 360, 12.05),

(31, 11, 608, 25.00),

(32, 40, 600, 6.50),
(32, 43, 500, 5.00);

-- 10. GOODS RECEIPTS (GRN RECORDS RECEIVED BY STAFF USER 3: EMILY WATSON)
INSERT INTO goods_receipts (receipt_id, receipt_number, purchase_order_id, received_by, received_at, status, total_items, has_discrepancies, notes) VALUES
(1, 'GRN-2026-0001', 19, 3, '2026-10-09 10:15:00', 'COMPLETED', 3, 0, 'Full shipment verified at Central Dock B. All batch numbers and seal checks intact.'),
(2, 'GRN-2026-0002', 20, 3, '2026-10-11 11:30:00', 'COMPLETED', 3, 0, 'Cold chain verified at 4.2°C. Inhalers and antibiotics transferred to stock.'),
(3, 'GRN-2026-0003', 21, 3, '2026-10-13 13:00:00', 'COMPLETED', 2, 0, 'Clean consignment. Allergenic tablets logged into warehouse shelf C-02.'),
(4, 'GRN-2026-0004', 22, 3, '2026-10-15 14:20:00', 'COMPLETED', 2, 0, 'Pain relief tablets verified against PO specs. Barcodes scanned successfully.'),
(5, 'GRN-2026-0005', 23, 3, '2026-10-17 15:45:00', 'COMPLETED', 2, 0, 'Gastrointestinal formulations verified and placed in dry ambient storage.'),
(6, 'GRN-2026-0006', 24, 3, '2026-10-19 16:10:00', 'COMPLETED', 2, 0, 'Nutrition bottles and strip packs accepted without damage.'),
(7, 'GRN-2026-0007', 25, 3, '2026-10-21 09:30:00', 'COMPLETED', 2, 0, 'Cardiovascular blister packs logged and added to clinical inventory.'),
(8, 'GRN-2026-0008', 26, 3, '2026-10-23 10:45:00', 'COMPLETED', 2, 0, 'Sterile dressings and ORS packets acknowledged and transferred to ER buffer.'),
(9, 'GRN-2026-0009', 27, 3, '2026-10-25 11:50:00', 'COMPLETED', 2, 0, 'Topical creams received with intact manufacturer tamper seals.'),
(10, 'GRN-2026-0010', 28, 3, '2026-10-26 14:00:00', 'COMPLETED', 3, 0, 'Apex Medical major consignment sign-off. Full invoice matched.'),
(11, 'GRN-2026-0011', 16, 3, '2026-10-29 15:15:00', 'PARTIALLY_RECEIVED', 2, 1, 'First consignment of 2 verified. Balance shipment scheduled for next delivery.'),
(12, 'GRN-2026-0012', 17, 3, '2026-10-31 16:30:00', 'PARTIALLY_RECEIVED', 2, 1, 'Partially checked in. Metformin & Dolo cleared; Atorvastatin batch en route.'),
(13, 'GRN-2026-0013', 18, 3, '2026-11-02 11:00:00', 'PARTIALLY_RECEIVED', 1, 0, 'Apollo consignment verified at dock. Second carton pending customs clearance.');

-- 11. GOODS RECEIPT ITEMS
INSERT INTO goods_receipt_items (receipt_id, medicine_id, quantity_ordered, quantity_received, batch_number, expiry_date, manufacturing_date, unit_cost) VALUES
(1, 1, 1000, 1000, 'BAT-PAR-202507', '2028-01-10', '2026-01-10', 3.50),
(1, 3, 500, 500, 'BAT-DOL-202509', '2028-02-01', '2026-01-20', 4.00),
(1, 33, 650, 650, 'BAT-MET-202539', '2029-02-01', '2026-08-01', 3.00),
(2, 7, 350, 350, 'BAT-AMX-202513', '2028-02-20', '2026-02-20', 8.00),
(2, 55, 100, 100, 'BAT-SAL-202552', '2028-10-15', '2026-10-15', 15.00),
(3, 14, 800, 800, 'BAT-CET-202520', '2028-05-01', '2026-04-01', 2.50),
(4, 2, 600, 600, 'BAT-IBU-202508', '2028-01-15', '2026-01-15', 4.50),
(5, 19, 600, 600, 'BAT-OME-202525', '2028-07-01', '2026-05-01', 5.00),
(6, 26, 800, 800, 'BAT-VTC-202532', '2028-10-15', '2026-06-10', 3.80),
(7, 44, 800, 800, 'BAT-AML-202548', '2029-06-15', '2026-09-20', 5.00),
(8, 39, 1500, 1500, 'BAT-ORS-202545', '2029-05-01', '2026-09-05', 1.50),
(9, 51, 600, 600, 'BAT-CLO-202421', '2027-01-22', '2025-04-15', 4.50),
(10, 33, 1200, 1200, 'BAT-MET-202539', '2029-02-01', '2026-08-01', 3.00),
(11, 1, 1000, 600, 'BAT-PAR-202507', '2028-01-10', '2026-01-10', 3.50),
(12, 3, 1000, 600, 'BAT-DOL-202509', '2028-02-01', '2026-01-20', 4.00),
(13, 40, 500, 300, 'BAT-POV-202418', '2027-01-02', '2025-04-01', 6.50);

-- 12. STOCK MOVEMENTS & AUDIT LOGS (40 REALISTIC MOVEMENTS ACROSS WARDS & DOCKS)
INSERT INTO stock_logs (stock_log_id, batch_id, user_id, transaction_type, quantity_changed, quantity_before, quantity_after, reference_type, reference_id, notes, created_at) VALUES
(1, 30, 3, 'RECEIVED', 1000, 0, 1000, 'PURCHASE_ORDER', 19, 'Initial goods inward sign-off for PO-2026-0019.', '2026-10-09 10:20:00'),
(2, 30, 3, 'DISPENSED', -150, 1000, 850, 'PRESCRIPTION', 101, 'Emergency ward weekly stock allocation.', '2026-10-12 11:30:00'),
(3, 30, 3, 'DISPENSED', -200, 850, 650, 'OUTPATIENT', 102, 'OPD clinic general dispensary distribution.', '2026-10-15 14:00:00'),
(4, 32, 3, 'RECEIVED', 1200, 0, 1200, 'PURCHASE_ORDER', 19, 'Dolo 650mg received from Apex Medical Supplies.', '2026-10-09 10:25:00'),
(5, 32, 3, 'DISPENSED', -350, 1200, 850, 'WARD_SUPPLY', 103, 'Surgical & ICU post-operative ward delivery.', '2026-10-16 09:45:00'),
(6, 36, 3, 'RECEIVED', 1500, 0, 1500, 'PURCHASE_ORDER', 20, 'Amoxicillin Novamox 500mg received.', '2026-10-11 11:35:00'),
(7, 36, 3, 'DISPENSED', -550, 1500, 950, 'WARD_SUPPLY', 104, 'Pediatric and general ward antibiotic dispensing.', '2026-10-18 10:15:00'),
(8, 43, 3, 'RECEIVED', 1200, 0, 1200, 'PURCHASE_ORDER', 21, 'Cetirizine 10mg allergy formulation delivery.', '2026-10-13 13:05:00'),
(9, 43, 3, 'DISPENSED', -380, 1200, 820, 'OUTPATIENT', 105, 'Outpatient allergy clinic weekly quota.', '2026-10-20 15:30:00'),
(10, 31, 3, 'RECEIVED', 800, 0, 800, 'PURCHASE_ORDER', 22, 'Ibuprofen Brufen 400mg stock intake.', '2026-10-15 14:25:00'),
(11, 31, 3, 'DISPENSED', -280, 800, 520, 'ORTHOPEDIC', 106, 'Orthopedic clinic dispensing.', '2026-10-22 11:10:00'),
(12, 48, 3, 'RECEIVED', 1100, 0, 1100, 'PURCHASE_ORDER', 23, 'Omeprazole 20mg capsules received.', '2026-10-17 15:50:00'),
(13, 48, 3, 'DISPENSED', -320, 1100, 780, 'GASTRO_WARD', 107, 'Gastroenterology inpatient ward transfer.', '2026-10-24 16:00:00'),
(14, 55, 3, 'RECEIVED', 1500, 0, 1500, 'PURCHASE_ORDER', 24, 'Limcee Vitamin C chewable delivery.', '2026-10-19 16:15:00'),
(15, 55, 3, 'DISPENSED', -400, 1500, 1100, 'GENERAL_DISP', 108, 'Hospital dietary & wellness ward dispensing.', '2026-10-26 12:00:00'),
(16, 71, 3, 'RECEIVED', 1200, 0, 1200, 'PURCHASE_ORDER', 25, 'Amlodipine 5mg cardiovascular stock intake.', '2026-10-21 09:35:00'),
(17, 71, 3, 'DISPENSED', -310, 1200, 890, 'CARDIAC_WARD', 109, 'Cardiology outpatient clinic replenishment.', '2026-10-28 10:20:00'),
(18, 68, 3, 'RECEIVED', 2000, 0, 2000, 'PURCHASE_ORDER', 26, 'Electral ORS sachets received.', '2026-10-23 10:50:00'),
(19, 68, 3, 'DISPENSED', -450, 2000, 1550, 'EMERGENCY_DEPT', 110, 'ER and pediatric dehydration recovery buffer.', '2026-10-29 14:40:00'),
(20, 21, 3, 'RECEIVED', 250, 0, 250, 'PURCHASE_ORDER', 27, 'Clotrimazole antifungal cream received.', '2026-10-25 11:55:00'),
(21, 21, 3, 'DISPENSED', -200, 250, 50, 'DERMATOLOGY', 111, 'Skin clinic patient prescriptions.', '2026-10-30 16:15:00'),
(22, 62, 3, 'RECEIVED', 1800, 0, 1800, 'PURCHASE_ORDER', 28, 'Glycomet Metformin 500mg received.', '2026-10-26 14:05:00'),
(23, 62, 3, 'DISPENSED', -450, 1800, 1350, 'DIABETES_CLINIC', 112, 'Diabetic care unit monthly allocation.', '2026-10-31 11:30:00'),
(24, 1, 2, 'ADJUSTED', -5, 20, 15, 'STOCK_AUDIT', 201, 'Quarterly audit adjustment: damaged box removed.', '2026-10-15 16:00:00'),
(25, 2, 2, 'ADJUSTED', -3, 28, 25, 'STOCK_AUDIT', 202, 'Packaging seal blemish reported during count.', '2026-10-20 17:00:00'),
(26, 75, 3, 'RECEIVED', 500, 0, 500, 'PURCHASE_ORDER', 20, 'Asthalin Salbutamol inhalers logged in.', '2026-10-11 11:40:00'),
(27, 75, 3, 'DISPENSED', -120, 500, 380, 'PULMONOLOGY', 113, 'Pulmonary function lab and chest ward allocation.', '2026-10-22 14:10:00'),
(28, 72, 3, 'RECEIVED', 1000, 0, 1000, 'PURCHASE_ORDER', 28, 'Atorvastatin 20mg lipid regulator intake.', '2026-10-26 14:10:00'),
(29, 72, 3, 'DISPENSED', -250, 1000, 750, 'CARDIAC_WARD', 114, 'Cardiology preventive therapy clinic.', '2026-11-01 09:15:00'),
(30, 49, 3, 'RECEIVED', 1400, 0, 1400, 'PURCHASE_ORDER', 23, 'Pan-40 Pantoprazole tablets received.', '2026-10-17 15:55:00'),
(31, 49, 3, 'DISPENSED', -420, 1400, 980, 'ICU_INPATIENT', 115, 'Intensive care stress-ulcer prophylaxis stock.', '2026-11-02 10:30:00'),
(32, 24, 3, 'DISPENSED', -2, 10, 8, 'WARD_TRANSFER', 116, 'Emergency buffer transfer to Trauma ward.', '2026-11-03 11:00:00'),
(33, 25, 3, 'DISPENSED', -3, 15, 12, 'WARD_TRANSFER', 117, 'Post-op ward antibiotic coverage.', '2026-11-03 14:20:00'),
(34, 26, 3, 'DISPENSED', -2, 7, 5, 'OUTPATIENT', 118, 'Urgent prescription fulfillment.', '2026-11-04 09:40:00'),
(35, 27, 3, 'DISPENSED', -1, 15, 14, 'OUTPATIENT', 119, 'Emergency refill.', '2026-11-04 11:15:00'),
(36, 28, 3, 'DISPENSED', -2, 8, 6, 'SURGICAL_SUITE', 120, 'Pre-operative antibiotic prophylaxis.', '2026-11-04 15:00:00'),
(37, 29, 3, 'DISPENSED', -1, 5, 4, 'ICU_WARD', 121, 'Critical insulin infusion prep.', '2026-11-05 08:30:00'),
(38, 5, 3, 'DISPENSED', -10, 50, 40, 'EMERGENCY_DEPT', 122, 'ER trauma bay analgesia buffer.', '2026-11-05 10:45:00'),
(39, 6, 3, 'DISPENSED', -3, 15, 12, 'PEDIATRICS', 123, 'Pediatric fever clinic protocol.', '2026-11-05 13:10:00'),
(40, 7, 3, 'DISPENSED', -5, 40, 35, 'MEDICINE_WARD', 124, 'Internal medicine ward requisition.', '2026-11-05 16:00:00');

-- 13. STOCK DISCREPANCIES (STAFF AUDIT CHECKS ON FLOOR)
INSERT INTO stock_discrepancies (discrepancy_id, batch_id, medicine_id, expected_quantity, counted_quantity, discrepancy, reason, reported_by, status, created_at) VALUES
(1, 24, 1, 10, 8, -2, 'Minor package tear noticed during morning ward bin check.', 3, 'PENDING', '2026-11-03 11:30:00'),
(2, 25, 7, 14, 12, -2, 'Discrepancy identified following urgent night shift dispensing.', 3, 'PENDING', '2026-11-03 14:45:00'),
(3, 26, 45, 6, 5, -1, 'Surplus blister pack recorded during physical audit.', 3, 'PENDING', '2026-11-04 10:00:00'),
(4, 27, 19, 15, 14, -1, 'Audit count variance in Shelf D-03.', 3, 'RESOLVED', '2026-11-02 09:15:00'),
(5, 39, 10, 345, 340, -5, 'Water moisture seepage on outer container.', 3, 'RESOLVED', '2026-10-28 16:00:00'),
(6, 43, 14, 820, 820, 0, 'Routine physical inventory check confirmed exact match.', 3, 'RESOLVED', '2026-10-25 11:00:00');

-- 14. STAFF TASKS (15 CONNECTED CLINICAL & INVENTORY FLOOR DUTIES)
INSERT INTO tasks (task_id, title, description, assigned_by, assigned_to, priority, status, due_date, created_at) VALUES
(1, 'Verify Goods Receipt for PO #PO-2026-0011', 'Apex Medical cold chain consignment arriving at Dock B. Verify temperature strip and barcode tags.', 2, 3, 'URGENT', 'PENDING', '2026-11-07 14:00:00', '2026-11-05 08:30:00'),
(2, 'Conduct Physical Count on Cardiovascular Category', 'Perform physical verification of Atorvastatin, Amlodipine and Telmisartan on Shelf Rack B-02.', 1, 3, 'HIGH', 'PENDING', '2026-11-08 17:00:00', '2026-11-05 09:00:00'),
(3, 'Quarantine Expired Batch BAT-PAR-202401', 'Transfer 15 units of expired Paracetamol from Main Storage to Segregated Quarantine Locker Q-1.', 2, 3, 'HIGH', 'PENDING', '2026-11-06 18:00:00', '2026-11-05 09:30:00'),
(4, 'Audit Antibiotics Expiring Within 7 Days', 'Check remaining units of Azithromycin (BAT-AZI-202406) and Amoxicillin in Ward 3 emergency stock.', 2, 9, 'URGENT', 'PENDING', '2026-11-07 12:00:00', '2026-11-05 10:00:00'),
(5, 'Inspect Cold Chain Temperature Logs (2°C - 8°C)', 'Download and record digital temperature loggers for biological vaccine and insulin refrigerators.', 1, 10, 'HIGH', 'IN_PROGRESS', '2026-11-06 17:00:00', '2026-11-05 10:30:00'),
(6, 'Reconcile Discrepancy for Amoxicillin Batch BAT-AMX-202502', 'Investigate 2-unit variance reported between system ledger and physical shelf count in Bay 4.', 2, 3, 'MEDIUM', 'IN_PROGRESS', '2026-11-07 16:00:00', '2026-11-05 11:15:00'),
(7, 'Prepare Dock Receiving Verification Manifest', 'Consolidate goods receipt notes GRN-2026-0010 through GRN-2026-0013 for weekly finance audit.', 1, 10, 'MEDIUM', 'IN_PROGRESS', '2026-11-08 15:00:00', '2026-11-05 13:00:00'),
(8, 'Verify Emergency ORS Stock in Pediatric Emergency', 'Restock 200 sachets of Electral ORS in pediatric triage cabinet 2.', 2, 11, 'NORMAL', 'COMPLETED', '2026-11-05 18:00:00', '2026-11-04 09:00:00'),
(9, 'Monthly First Aid Dressing Clean-up and Reshelving', 'Inspect sterile packaging integrity on roller bandages and Povidone Iodine ointments.', 1, 3, 'NORMAL', 'COMPLETED', '2026-11-04 17:00:00', '2026-11-03 10:00:00'),
(10, 'Complete Stock Discrepancy Form for Omeprazole', 'File resolution notes and supervisor sign-off for resolved variance on batch BAT-OMP-202403.', 2, 3, 'MEDIUM', 'COMPLETED', '2026-11-03 16:00:00', '2026-11-02 11:30:00'),
(11, 'Dock Receiving Check: PO #PO-2026-0012 Green Cross', 'Inspect incoming shipment of Cephalosporins; record lot numbers on paper receiving sheet.', 2, 3, 'HIGH', 'PENDING', '2026-11-08 12:00:00', '2026-11-05 14:00:00'),
(12, 'Review Dermatology Shelf Expiry Labels', 'Scan Clotrimazole and Betamethasone tubes for expiration dates falling within 60 days.', 2, 9, 'MEDIUM', 'PENDING', '2026-11-09 17:00:00', '2026-11-05 15:00:00'),
(13, 'Hospital Disaster Preparedness Stock Check', 'Audit inventory levels of IV Ceftriaxone, Salbutamol inhalers, and analgesics for emergency readiness.', 1, 3, 'HIGH', 'PENDING', '2026-11-10 16:00:00', '2026-11-05 15:30:00'),
(14, 'Sanitize and Calibrate Dispensary Counting Trays', 'Perform routine decontamination of pharmacy tablet counting apparatus in outpatient unit.', 2, 11, 'NORMAL', 'COMPLETED', '2026-11-05 12:00:00', '2026-11-04 14:00:00'),
(15, 'Return Supplier Consignment Wooden Pallets', 'Stage empty transport pallets at Dock A for collection by Sri Medical Distributors truck.', 1, 10, 'NORMAL', 'COMPLETED', '2026-11-04 16:00:00', '2026-11-03 13:00:00');

-- 15. NOTIFICATIONS (20 REALISTIC CROSS-ROLE ALERTS FOR ADMIN, PHARMACIST & STAFF)
INSERT INTO notifications (notification_id, user_id, title, message, notification_type, related_entity_type, related_entity_id, is_read, priority, created_at) VALUES
-- Admin Notifications (user 1)
(1, 1, 'Requisition Awaiting Approval', 'Pharmacist Alex Rivera submitted Purchase Order #PO-2026-0001 ($2,450.00) for review.', 'PURCHASE_ORDER', 'PURCHASE_ORDER', 1, 0, 'HIGH', '2026-11-04 09:20:00'),
(2, 1, 'Urgent Requisition Pending', 'PO #PO-2026-0002 ($5,120.00) submitted by Alex Rivera requires budget approval.', 'PURCHASE_ORDER', 'PURCHASE_ORDER', 2, 0, 'HIGH', '2026-11-04 10:35:00'),
(3, 1, 'Low Stock Alert: Atorvastatin 20mg', 'Atorvastatin 20mg (Batch BAT-ATO-202503) has fallen to 5 units. Reorder recommended.', 'STOCK_ALERT', 'MEDICINE', 45, 0, 'HIGH', '2026-11-05 08:00:00'),
(4, 1, 'Stock Discrepancy Logged', 'Nurse Emily Watson reported a count discrepancy of -2 units on Paracetamol 500mg.', 'DISCREPANCY', 'DISCREPANCY', 1, 0, 'NORMAL', '2026-11-03 11:35:00'),
(5, 1, 'Near Expiry Batch Alert', '4 batches with 107 total units are expiring within 7 days. Quarantine action recommended.', 'EXPIRY_ALERT', 'BATCH', 5, 0, 'HIGH', '2026-11-05 08:30:00'),
(6, 1, 'Delivery Completed: PO-2026-0028', 'Staff completed receiving verification for Apex Medical Supplies ($9,300.00).', 'DELIVERY', 'GOODS_RECEIPT', 10, 1, 'NORMAL', '2026-10-26 14:15:00'),

-- Pharmacist Notifications (user 2: Alex Rivera)
(7, 2, 'Purchase Order Approved', 'Admin approved PO #PO-2026-0005 ($6,200.00) for Apex Medical Supplies Ltd.', 'PURCHASE_ORDER', 'PURCHASE_ORDER', 5, 0, 'NORMAL', '2026-11-01 08:35:00'),
(8, 2, 'Purchase Order Approved', 'Admin approved PO #PO-2026-0006 ($4,100.00) for Apollo Medical Supplies.', 'PURCHASE_ORDER', 'PURCHASE_ORDER', 6, 0, 'NORMAL', '2026-11-01 09:05:00'),
(9, 2, 'Purchase Order Declined', 'Admin declined PO #PO-2026-0029 ($12,500.00). Reason: Budget ceiling exceeded for Q4 quota.', 'PURCHASE_ORDER', 'PURCHASE_ORDER', 29, 0, 'HIGH', '2026-10-25 09:05:00'),
(10, 2, 'Delivery Dispatched by Supplier', 'Apex Medical Supplies marked PO #PO-2026-0011 as IN_TRANSIT with Blue Dart Tracking #TRK-8811.', 'DELIVERY', 'PURCHASE_ORDER', 11, 0, 'NORMAL', '2026-10-28 09:30:00'),
(11, 2, 'Critical Expiry Warning', 'Dolo 650mg batch BAT-DOL-202405 expires in 4 days. Please initiate shelf rotation.', 'EXPIRY_ALERT', 'BATCH', 5, 0, 'HIGH', '2026-11-05 08:45:00'),
(12, 2, 'Low Stock Warning: Insulin Regular', 'Insulin Regular 100IU/ml has dropped to 4 vials. Immediate PO generation suggested.', 'STOCK_ALERT', 'MEDICINE', 38, 0, 'HIGH', '2026-11-05 09:00:00'),
(13, 2, 'Goods Receipt Completed', 'GRN-2026-0010 recorded by Nurse Emily Watson. Inventory automatically updated.', 'GOODS_RECEIPT', 'GOODS_RECEIPT', 10, 1, 'NORMAL', '2026-10-26 14:20:00'),

-- Staff Notifications (user 3: Nurse Emily Watson)
(14, 3, 'New Task Assigned: Verify Inward PO', 'Alex Rivera assigned you to verify incoming delivery for PO #PO-2026-0011 (Apex Medical).', 'TASK', 'TASK', 1, 0, 'HIGH', '2026-11-05 08:35:00'),
(15, 3, 'Stock Audit Task Assigned', 'Admin assigned task: Conduct Physical Count on Cardiovascular Category by Nov 8.', 'TASK', 'TASK', 2, 0, 'NORMAL', '2026-11-05 09:05:00'),
(16, 3, 'Quarantine Directive Issued', 'Please move 15 units of expired Paracetamol (BAT-PAR-202401) to Locker Q-1.', 'TASK', 'TASK', 3, 0, 'HIGH', '2026-11-05 09:35:00'),
(17, 3, 'Incoming Shipment Notice', 'Green Cross Pharmaceuticals driver dispatched shipment for PO-2026-0012 to Dock B.', 'DELIVERY', 'PURCHASE_ORDER', 12, 0, 'NORMAL', '2026-10-29 10:15:00'),
(18, 3, 'Partial Delivery Recorded', 'GRN-2026-0011 logged. 600 of 1,000 units verified for Sri Medical Distributors.', 'GOODS_RECEIPT', 'GOODS_RECEIPT', 11, 1, 'NORMAL', '2026-10-29 15:20:00'),
(19, 3, 'Discrepancy Investigation Required', 'Please cross-verify batch number on Amoxicillin Novamox shelf B-04.', 'TASK', 'TASK', 6, 0, 'NORMAL', '2026-11-05 11:20:00'),
(20, 3, 'Cold Chain Refrigerator Check', 'Reminder: Weekly calibration logs for Vaccine Fridge 1 due for sign-off.', 'TASK', 'TASK', 5, 1, 'NORMAL', '2026-11-05 10:35:00');

-- 16. AUDIT LOGS (SAMPLE GOVERNANCE & COMPLIANCE LOGS)
INSERT INTO audit_logs (audit_log_id, user_id, action_type, entity_type, entity_id, action_description, ip_address, created_at) VALUES
(1, 1, 'USER_LOGIN', 'USER', 1, 'Administrator session authenticated successfully.', '127.0.0.1', '2026-11-05 08:00:00'),
(2, 2, 'PO_CREATE', 'PURCHASE_ORDER', 1, 'Created Purchase Order PO-2026-0001 for Sri Medical Distributors.', '127.0.0.1', '2026-11-04 09:15:00'),
(3, 1, 'PO_APPROVE', 'PURCHASE_ORDER', 5, 'Approved Purchase Order PO-2026-0005 for Apex Medical Supplies Ltd.', '127.0.0.1', '2026-11-01 08:30:00'),
(4, 1, 'PO_REJECT', 'PURCHASE_ORDER', 29, 'Declined Purchase Order PO-2026-0029 due to budget ceiling threshold.', '127.0.0.1', '2026-10-25 09:00:00'),
(5, 3, 'RECEIPT_CONFIRM', 'GOODS_RECEIPT', 1, 'Verified goods receipt note GRN-2026-0001 at receiving dock B.', '127.0.0.1', '2026-10-09 10:15:00'),
(6, 3, 'STOCK_DISCREPANCY_LOG', 'STOCK_DISCREPANCY', 1, 'Reported physical inventory audit variance of -2 units on Paracetamol.', '127.0.0.1', '2026-11-03 11:30:00'),
(7, 2, 'MEDICINE_UPDATE', 'MEDICINE', 1, 'Updated reorder threshold and dosage description for Paracetamol 500mg.', '127.0.0.1', '2026-11-02 14:00:00'),
(8, 1, 'SUPPLIER_STATUS_UPDATE', 'SUPPLIER', 11, 'Verified ISO 9001 quality audit documentation for Apex Medical Supplies Ltd.', '127.0.0.1', '2026-10-28 11:00:00');

-- 17. FEFO (FIRST EXPIRED, FIRST OUT) ALLOCATIONS (SAMPLE AUDIT TRAIL)
INSERT INTO fefo_allocations 
(allocation_id, medicine_id, batch_id, user_id, requested_quantity, allocated_quantity, is_fefo_compliant, recommended_batch_id, batch_expiry_date, earliest_available_expiry, override_reason, reference_type, reference_number, notes, created_at)
VALUES
(1,  1, 30, 2, 150, 150, 1, 30, '2028-01-10', '2028-01-10', NULL, 'PRESCRIPTION', 'RX-2026-0091', 'Emergency ward weekly stock allocation', '2026-10-12 11:30:00'),
(2,  1, 30, 2, 200, 200, 1, 30, '2028-01-10', '2028-01-10', NULL, 'OUTPATIENT',   'OPD-2026-1044', 'OPD clinic general dispensary distribution', '2026-10-15 14:00:00'),
(3,  3, 32, 2, 350, 350, 1, 32, '2028-02-01', '2028-02-01', NULL, 'WARD_SUPPLY',  'WRD-2026-0812', 'Surgical & ICU post-operative ward delivery', '2026-10-16 09:45:00'),
(4,  7, 36, 2, 550, 550, 1, 36, '2028-02-20', '2028-02-20', NULL, 'WARD_SUPPLY',  'WRD-2026-0850', 'Pediatric and general ward antibiotic dispensing', '2026-10-18 10:15:00'),
(5, 14, 43, 2, 380, 380, 1, 43, '2028-05-01', '2028-05-01', NULL, 'OUTPATIENT',   'OPD-2026-1102', 'Outpatient allergy clinic weekly quota', '2026-10-20 15:30:00'),
(6,  2, 31, 2, 280, 280, 1, 31, '2028-01-15', '2028-01-15', NULL, 'ORTHOPEDIC',   'ORT-2026-0419', 'Orthopedic clinic dispensing', '2026-10-22 11:10:00'),
(7, 19, 48, 2, 320, 320, 1, 48, '2028-07-01', '2028-07-01', NULL, 'GASTRO_WARD',  'GAS-2026-0332', 'Gastroenterology inpatient ward transfer', '2026-10-24 16:00:00'),
(8, 26, 55, 2, 400, 400, 1, 55, '2028-10-15', '2028-10-15', NULL, 'GENERAL_DISP', 'DSP-2026-0901', 'Hospital dietary & wellness ward dispensing', '2026-10-26 12:00:00'),
(9, 44, 71, 2, 310, 310, 1, 71, '2029-06-15', '2029-06-15', NULL, 'CARDIAC_WARD', 'CRD-2026-0524', 'Cardiology outpatient clinic replenishment', '2026-10-28 10:20:00'),
(10, 39, 68, 2, 450, 450, 1, 68, '2029-05-01', '2029-05-01', NULL, 'EMERGENCY_DEPT','ER-2026-1209',  'ER and pediatric dehydration recovery buffer', '2026-10-29 14:40:00'),
(11, 51, 21, 2, 200, 200, 1, 21, '2027-01-22', '2027-01-22', NULL, 'DERMATOLOGY',   'DRM-2026-0210', 'Skin clinic patient prescriptions', '2026-10-30 16:15:00'),
(12, 33, 62, 2, 450, 450, 1, 62, '2029-02-01', '2029-02-01', NULL, 'DIABETES_CLINIC','DIA-2026-0771','Diabetic care unit monthly allocation', '2026-10-31 11:30:00'),
(13, 55, 75, 2, 120, 120, 1, 75, '2028-10-15', '2028-10-15', NULL, 'PULMONOLOGY',  'PUL-2026-0188', 'Pulmonary function lab and chest ward allocation', '2026-10-22 14:10:00'),
(14, 45, 72, 2, 250, 250, 1, 72, '2029-07-01', '2029-07-01', NULL, 'CARDIAC_WARD', 'CRD-2026-0610', 'Cardiology preventive therapy clinic', '2026-11-01 09:15:00'),
(15, 20, 49, 2, 420, 420, 1, 49, '2028-07-10', '2028-07-10', NULL, 'ICU_INPATIENT', 'ICU-2026-0412', 'Intensive care stress-ulcer prophylaxis stock', '2026-11-02 10:30:00'),
(16,  1, 24, 2,   2,   2, 1, 24, '2027-08-01', '2027-08-01', NULL, 'WARD_TRANSFER', 'TRN-2026-0311', 'Emergency buffer transfer to Trauma ward', '2026-11-03 11:00:00'),
(17,  7, 25, 2,   3,   3, 1, 25, '2027-09-01', '2027-09-01', NULL, 'WARD_TRANSFER', 'TRN-2026-0312', 'Post-op ward antibiotic coverage', '2026-11-03 14:20:00'),
(18, 45, 26, 2,   2,   2, 1, 26, '2027-09-15', '2027-09-15', NULL, 'OUTPATIENT',    'OPD-2026-1190', 'Urgent prescription fulfillment', '2026-11-04 09:40:00'),
(19, 19, 27, 2,   1,   1, 1, 27, '2027-10-01', '2027-10-01', NULL, 'OUTPATIENT',    'OPD-2026-1195', 'Emergency refill', '2026-11-04 11:15:00'),
(20, 11, 28, 2,   2,   2, 1, 28, '2027-07-20', '2027-07-20', NULL, 'SURGICAL_SUITE','SUR-2026-0044', 'Pre-operative antibiotic prophylaxis', '2026-11-04 15:00:00'),
(21, 38, 29, 2,   1,   1, 1, 29, '2027-06-01', '2027-06-01', NULL, 'ICU_WARD',      'ICU-2026-0489', 'Critical insulin infusion prep', '2026-11-05 08:30:00'),
(22,  3,  5, 2,  10,  10, 1,  5, '2026-11-10', '2026-11-10', NULL, 'EMERGENCY_DEPT','ER-2026-1302',  'ER trauma bay analgesia buffer - Critical near expiry used first', '2026-11-05 10:45:00'),
(23,  8,  6, 2,   3,   3, 1,  6, '2026-11-12', '2026-11-12', NULL, 'PEDIATRICS',    'PED-2026-0521', 'Pediatric fever clinic protocol - Salvaged critical batch', '2026-11-05 13:10:00'),
(24, 20,  7, 2,   5,   5, 1,  7, '2026-11-11', '2026-11-11', NULL, 'MEDICINE_WARD', 'WRD-2026-0902', 'Internal medicine ward requisition - Critical batch used', '2026-11-05 16:00:00'),
(25,  2, 31, 2,  15,  15, 0,  8, '2028-01-15', '2026-11-13', 'Doctor specified long-dated oral suspension brand', 'CLINIC', 'CLN-2026-0104', 'FEFO deviation authorized with medical director note', '2026-11-05 17:15:00');

SET FOREIGN_KEY_CHECKS = 1;
