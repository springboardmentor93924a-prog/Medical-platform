-- ===================================================================
-- MediStock Comprehensive Sample Data Population Script
-- Idempotent (ON DUPLICATE KEY UPDATE), fully interconnected across
-- Admin, Pharmacist, Staff, and Supplier roles.
-- ===================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------
-- 1. Standard 12 Categories
-- -------------------------------------------------------------------
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Pain Relief', 'Analgesic, antipyretic, and anti-inflammatory medications for acute and chronic pain')
ON DUPLICATE KEY UPDATE category_name='Pain Relief', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(2, 'Antibiotics', 'Broad-spectrum and targeted antibacterial and antimicrobial agents')
ON DUPLICATE KEY UPDATE category_name='Antibiotics', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(3, 'Diabetes Care', 'Oral hypoglycemics, insulin analogs, and blood glucose management therapeutics')
ON DUPLICATE KEY UPDATE category_name='Diabetes Care', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(4, 'Cardiovascular', 'Antihypertensives, statins, antiarrhythmics, and cardiac therapeutics')
ON DUPLICATE KEY UPDATE category_name='Cardiovascular', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(5, 'Digestive Health', 'Antacids, proton pump inhibitors, gastrointestinal motility and antiulcer drugs')
ON DUPLICATE KEY UPDATE category_name='Digestive Health', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(6, 'Respiratory Care', 'Bronchodilators, inhaled corticosteroids, and pulmonary medications')
ON DUPLICATE KEY UPDATE category_name='Respiratory Care', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(7, 'Vitamins & Supplements', 'Essential multivitamins, mineral supplements, and clinical nutrition')
ON DUPLICATE KEY UPDATE category_name='Vitamins & Supplements', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(8, 'Dermatology', 'Topical antifungals, corticosteroids, barrier creams, and wound healing ointments')
ON DUPLICATE KEY UPDATE category_name='Dermatology', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(9, 'Allergy & Cold', 'Antihistamines, decongestants, expectorants, and cough suppressants')
ON DUPLICATE KEY UPDATE category_name='Allergy & Cold', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(10, 'First Aid', 'Antiseptics, burn care, oral rehydration salts, and emergency dressings')
ON DUPLICATE KEY UPDATE category_name='First Aid', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(11, 'Eye Care', 'Ophthalmic antibacterial drops, lubricants, and ocular anti-inflammatory solutions')
ON DUPLICATE KEY UPDATE category_name='Eye Care', description=VALUES(description);

INSERT INTO categories (category_id, category_name, description) VALUES
(12, 'General Medicines', 'Electrolyte infusions, normal saline, sterile water, and general inpatient drugs')
ON DUPLICATE KEY UPDATE category_name='General Medicines', description=VALUES(description);

-- -------------------------------------------------------------------
-- 2. Standard 15 Medical Suppliers
-- -------------------------------------------------------------------
INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(1, 'Apex Medical Supplies Ltd', 'Arthur Pendelton', '+1 800-555-0192', 'supplier@medistock.com', '100 Healthpark Blvd, Suite 400, Chicago, IL', 1)
ON DUPLICATE KEY UPDATE supplier_name='Apex Medical Supplies Ltd', email='supplier@medistock.com', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(2, 'BioHealth Pharmaceuticals', 'Dr. Aris Thorne', '+1 800-555-0245', 'supply@biohealth.example.com', '45 Biotech Way, Cambridge, MA', 1)
ON DUPLICATE KEY UPDATE supplier_name='BioHealth Pharmaceuticals', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(3, 'Global Care Logistics', 'Marjorie Vance', '+1 800-555-0311', 'dispatch@globalcare.example.com', '780 Harbor Drive, Logistics Hub, Newark, NJ', 1)
ON DUPLICATE KEY UPDATE supplier_name='Global Care Logistics', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(4, 'Sanovita Laboratories', 'Klaus Weber', '+1 800-555-0450', 'orders@sanovita.example.com', '12 Pharma Ring, Research Triangle Park, NC', 1)
ON DUPLICATE KEY UPDATE supplier_name='Sanovita Laboratories', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(5, 'Sri Medical Distributors', 'R. K. Ramanathan', '+91 98401 23456', 'orders@srimedical.example.com', '44 Anna Salai, Mount Road, Chennai, TN', 1)
ON DUPLICATE KEY UPDATE supplier_name='Sri Medical Distributors', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(6, 'Apollo Medical Supplies', 'Dr. Sunita Rao', '+91 98200 54321', 'supply@apollomed.example.com', '12 Jubilee Hills, Medical City, Hyderabad, TS', 1)
ON DUPLICATE KEY UPDATE supplier_name='Apollo Medical Supplies', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(7, 'Green Cross Pharmaceuticals', 'Marcus Chen', '+1 800-555-0789', 'orders@greencross.example.com', '88 Greenway Plaza, Suite 120, Houston, TX', 1)
ON DUPLICATE KEY UPDATE supplier_name='Green Cross Pharmaceuticals', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(8, 'HealthCare Distributors', 'Priya Sharma', '+91 98111 67890', 'contact@healthcaredist.example.com', '10 Connaught Place, Block B, New Delhi, DL', 1)
ON DUPLICATE KEY UPDATE supplier_name='HealthCare Distributors', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(9, 'MedPlus Wholesale', 'Vikram Patel', '+91 98765 43210', 'sales@medpluswholesale.example.com', '22 Outer Ring Road, Bellandur, Bengaluru, KA', 1)
ON DUPLICATE KEY UPDATE supplier_name='MedPlus Wholesale', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(10, 'Prime Pharma Solutions', 'Sarah Jenkins', '+1 800-555-0912', 'procurement@primepharma.example.com', '500 Innovation Way, Boston, MA', 1)
ON DUPLICATE KEY UPDATE supplier_name='Prime Pharma Solutions', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(11, 'Southern Medical Agencies', 'K. Balasubramanian', '+91 98450 11223', 'dist@southernmed.example.com', '15 Marine Beach Road, Willingdon Island, Kochi, KL', 1)
ON DUPLICATE KEY UPDATE supplier_name='Southern Medical Agencies', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(12, 'LifeCare Distributors', 'Elena Rostova', '+1 800-555-0345', 'orders@lifecaredist.example.com', '300 Medical Center Dr, Denver, CO', 1)
ON DUPLICATE KEY UPDATE supplier_name='LifeCare Distributors', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(13, 'City Pharma Suppliers', 'Amitabh Sen', '+91 98300 99887', 'dispatch@citypharma.example.com', '7 Park Street, Sector 3, Kolkata, WB', 1)
ON DUPLICATE KEY UPDATE supplier_name='City Pharma Suppliers', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(14, 'Universal Drug House', 'Rajesh Varma', '+91 98222 33445', 'info@universaldrug.example.com', '55 MG Road, Fort Commercial Area, Mumbai, MH', 1)
ON DUPLICATE KEY UPDATE supplier_name='Universal Drug House', is_active=1;

INSERT INTO suppliers (supplier_id, supplier_name, contact_person, phone, email, address, is_active) VALUES
(15, 'MetroCare Pharma Logistics', 'David Miller', '+1 800-555-0811', 'support@metrocarelogistics.example.com', '210 Air Cargo City, Airport Road, Atlanta, GA', 1)
ON DUPLICATE KEY UPDATE supplier_name='MetroCare Pharma Logistics', is_active=1;

-- -------------------------------------------------------------------
-- 3. Realistic Medicine Records (60+ Medicines)
-- -------------------------------------------------------------------
-- Category 1: Pain Relief
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(1, 1, 'Paracetamol 500mg', 'Dolo 500', 'Acetaminophen', '500 mg', 'Tablet', 'Analgesic and antipyretic for mild to moderate pain and fever')
ON DUPLICATE KEY UPDATE medicine_name='Paracetamol 500mg', category_id=1, brand_name='Dolo 500', generic_name='Acetaminophen';

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(3, 1, 'Ibuprofen 400mg', 'Brufen / Advil', 'Ibuprofen', '400 mg', 'Tablet', 'Nonsteroidal anti-inflammatory drug (NSAID) for inflammatory pain and fever')
ON DUPLICATE KEY UPDATE medicine_name='Ibuprofen 400mg', category_id=1;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(12, 1, 'Dolo 650mg', 'Dolo 650', 'Paracetamol', '650 mg', 'Tablet', 'Fast-acting antipyretic and analgesic for acute fever and body ache')
ON DUPLICATE KEY UPDATE medicine_name='Dolo 650mg', category_id=1;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(13, 1, 'Tramadol 50mg', 'Ultram', 'Tramadol Hydrochloride', '50 mg', 'Capsule', 'Centrally acting synthetic opioid analgesic for moderate to severe pain')
ON DUPLICATE KEY UPDATE medicine_name='Tramadol 50mg', category_id=1;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(14, 1, 'Diclofenac Sodium 50mg', 'Voltaren', 'Diclofenac Sodium', '50 mg', 'Tablet', 'NSAID for postoperative pain, osteoarthritis, and acute musculoskeletal injury')
ON DUPLICATE KEY UPDATE medicine_name='Diclofenac Sodium 50mg', category_id=1;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(15, 1, 'Aceclofenac 100mg', 'Zerodol', 'Aceclofenac', '100 mg', 'Tablet', 'NSAID with superior gastrointestinal tolerability for joint inflammation')
ON DUPLICATE KEY UPDATE medicine_name='Aceclofenac 100mg', category_id=1;

-- Category 2: Antibiotics
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(2, 2, 'Amoxicillin 250mg', 'Amoxil', 'Amoxicillin Trihydrate', '250 mg', 'Capsule', 'Broad-spectrum beta-lactam antibiotic for bacterial infections')
ON DUPLICATE KEY UPDATE medicine_name='Amoxicillin 250mg', category_id=2;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(6, 2, 'Ciprofloxacin 500mg', 'Cipro', 'Ciprofloxacin', '500 mg', 'Tablet', 'Fluoroquinolone antibiotic for urinary tract and gastrointestinal infections')
ON DUPLICATE KEY UPDATE medicine_name='Ciprofloxacin 500mg', category_id=2;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(16, 2, 'Amoxicillin 500mg', 'Mox 500', 'Amoxicillin', '500 mg', 'Capsule', 'High-strength beta-lactam antibiotic for respiratory and dental infections')
ON DUPLICATE KEY UPDATE medicine_name='Amoxicillin 500mg', category_id=2;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(17, 2, 'Azithromycin 500mg', 'Zithromax / Azithral', 'Azithromycin', '500 mg', 'Tablet', 'Macrolide antibiotic with extended tissue penetration for chest and ear infections')
ON DUPLICATE KEY UPDATE medicine_name='Azithromycin 500mg', category_id=2;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(18, 2, 'Ceftriaxone 1g Injection', 'Rocephin', 'Ceftriaxone Sodium', '1 g', 'Injection', 'Third-generation cephalosporin for severe hospital-acquired bacterial infections')
ON DUPLICATE KEY UPDATE medicine_name='Ceftriaxone 1g Injection', category_id=2;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(19, 2, 'Doxycycline 100mg', 'Vibramycin', 'Doxycycline Hyclate', '100 mg', 'Capsule', 'Tetracycline antibiotic for atypical pneumonia, skin infections, and malaria prophylaxis')
ON DUPLICATE KEY UPDATE medicine_name='Doxycycline 100mg', category_id=2;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(20, 2, 'Augmentin 625mg', 'Augmentin', 'Amoxicillin + Clavulanate', '625 mg', 'Tablet', 'Beta-lactamase inhibitor combination for resistant bacterial infections')
ON DUPLICATE KEY UPDATE medicine_name='Augmentin 625mg', category_id=2;

-- Category 3: Diabetes Care
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(5, 3, 'Metformin 500mg', 'Glucophage', 'Metformin HCl', '500 mg', 'Tablet', 'First-line biguanide antihyperglycemic for type 2 diabetes management')
ON DUPLICATE KEY UPDATE medicine_name='Metformin 500mg', category_id=3;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(21, 3, 'Glimepiride 2mg', 'Amaryl', 'Glimepiride', '2 mg', 'Tablet', 'Second-generation sulfonylurea for stimulating pancreatic beta-cell insulin secretion')
ON DUPLICATE KEY UPDATE medicine_name='Glimepiride 2mg', category_id=3;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(22, 3, 'Sitagliptin 100mg', 'Januvia', 'Sitagliptin Phosphate', '100 mg', 'Tablet', 'DPP-4 inhibitor improving glycemic control by enhancing active incretin hormone levels')
ON DUPLICATE KEY UPDATE medicine_name='Sitagliptin 100mg', category_id=3;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(23, 3, 'Dapagliflozin 10mg', 'Forxiga', 'Dapagliflozin', '10 mg', 'Tablet', 'SGLT2 inhibitor reducing renal glucose reabsorption for glycemic and cardiovascular benefit')
ON DUPLICATE KEY UPDATE medicine_name='Dapagliflozin 10mg', category_id=3;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(24, 3, 'Human Insulin 100IU/ml', 'Humulin R', 'Regular Insulin', '100 IU/ml', 'Vial', 'Short-acting regular human insulin for blood glucose control during meals and ketoacidosis')
ON DUPLICATE KEY UPDATE medicine_name='Human Insulin 100IU/ml', category_id=3;

-- Category 4: Cardiovascular
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(9, 4, 'Amlodipine 5mg', 'Norvasc', 'Amlodipine Besylate', '5 mg', 'Tablet', 'Dihydropyridine calcium channel blocker for essential hypertension and chronic stable angina')
ON DUPLICATE KEY UPDATE medicine_name='Amlodipine 5mg', category_id=4;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(10, 4, 'Atorvastatin 20mg', 'Lipitor', 'Atorvastatin Calcium', '20 mg', 'Tablet', 'HMG-CoA reductase inhibitor for dyslipidemia and primary prevention of coronary events')
ON DUPLICATE KEY UPDATE medicine_name='Atorvastatin 20mg', category_id=4;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(25, 4, 'Telmisartan 40mg', 'Micardis', 'Telmisartan', '40 mg', 'Tablet', 'Angiotensin II receptor blocker (ARB) for blood pressure control and cardiovascular protection')
ON DUPLICATE KEY UPDATE medicine_name='Telmisartan 40mg', category_id=4;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(26, 4, 'Metoprolol Tartrate 50mg', 'Lopressor', 'Metoprolol Tartrate', '50 mg', 'Tablet', 'Cardioselective beta-1 adrenergic blocker for angina, post-MI therapy, and hypertension')
ON DUPLICATE KEY UPDATE medicine_name='Metoprolol Tartrate 50mg', category_id=4;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(27, 4, 'Clopidogrel 75mg', 'Plavix', 'Clopidogrel Bisulfate', '75 mg', 'Tablet', 'Platelet aggregation inhibitor for secondary prevention of atherothrombotic events')
ON DUPLICATE KEY UPDATE medicine_name='Clopidogrel 75mg', category_id=4;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(28, 4, 'Furosemide 40mg', 'Lasix', 'Furosemide', '40 mg', 'Tablet', 'Potent loop diuretic for acute and chronic edema secondary to heart failure and renal disease')
ON DUPLICATE KEY UPDATE medicine_name='Furosemide 40mg', category_id=4;

-- Category 5: Digestive Health
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(4, 5, 'Omeprazole 20mg', 'Prilosec', 'Omeprazole Magnesium', '20 mg', 'Capsule', 'Proton pump inhibitor reducing gastric acid secretion for GERD and peptic ulcers')
ON DUPLICATE KEY UPDATE medicine_name='Omeprazole 20mg', category_id=5;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(29, 5, 'Pantoprazole 40mg', 'Protonix / Pantocid', 'Pantoprazole Sodium', '40 mg', 'Tablet', 'Selective proton pump inhibitor for severe gastroesophageal reflux and erosive esophagitis')
ON DUPLICATE KEY UPDATE medicine_name='Pantoprazole 40mg', category_id=5;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(30, 5, 'Rabeprazole 20mg', 'AcipHex / Razo', 'Rabeprazole Sodium', '20 mg', 'Tablet', 'Rapid-onset gastric proton pump inhibitor for peptic ulcer disease')
ON DUPLICATE KEY UPDATE medicine_name='Rabeprazole 20mg', category_id=5;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(31, 5, 'Ondansetron 4mg', 'Zofran', 'Ondansetron HCl', '4 mg', 'Tablet', 'Selective 5-HT3 receptor antagonist antiemetic for chemotherapy and postoperative nausea')
ON DUPLICATE KEY UPDATE medicine_name='Ondansetron 4mg', category_id=5;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(32, 5, 'Domperidone 10mg', 'Motilium', 'Domperidone', '10 mg', 'Tablet', 'Peripheral dopamine receptor antagonist prokinetic for gastric stasis and nausea')
ON DUPLICATE KEY UPDATE medicine_name='Domperidone 10mg', category_id=5;

-- Category 6: Respiratory Care
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(7, 6, 'Salbutamol Inhaler', 'Ventolin', 'Albuterol Sulfate', '100 mcg', 'Inhaler', 'Short-acting beta-2 agonist bronchodilator for acute asthma and bronchospasm relief')
ON DUPLICATE KEY UPDATE medicine_name='Salbutamol Inhaler', category_id=6;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(33, 6, 'Budesonide Inhaler 200mcg', 'Pulmicort', 'Budesonide', '200 mcg', 'Inhaler', 'Inhaled maintenance corticosteroid for long-term control of persistent asthma symptoms')
ON DUPLICATE KEY UPDATE medicine_name='Budesonide Inhaler 200mcg', category_id=6;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(34, 6, 'Montelukast 10mg', 'Singulair', 'Montelukast Sodium', '10 mg', 'Tablet', 'Leukotriene receptor antagonist for chronic bronchial asthma and allergic rhinitis prophylaxis')
ON DUPLICATE KEY UPDATE medicine_name='Montelukast 10mg', category_id=6;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(35, 6, 'Dextromethorphan Syrup', 'Benylin Dry Cough', 'Dextromethorphan HBr', '10 mg/5ml', 'Syrup', 'Centrally acting non-opioid antitussive for temporary relief of non-productive dry cough')
ON DUPLICATE KEY UPDATE medicine_name='Dextromethorphan Syrup', category_id=6;

-- Category 7: Vitamins & Supplements
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(8, 7, 'Vitamin C 500mg', 'Limcee', 'Ascorbic Acid', '500 mg', 'Chewable', 'Antioxidant and essential micronutrient supporting collagen synthesis and immune defense')
ON DUPLICATE KEY UPDATE medicine_name='Vitamin C 500mg', category_id=7;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(36, 7, 'Vitamin D3 60000 IU', 'Calcirol', 'Cholecalciferol', '60,000 IU', 'Capsule', 'High-potency cholecalciferol for therapeutic correction of severe vitamin D deficiency')
ON DUPLICATE KEY UPDATE medicine_name='Vitamin D3 60000 IU', category_id=7;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(37, 7, 'B-Complex with Zinc', 'Becozinc', 'Vitamin B Complex + Zinc', 'Standard', 'Capsule', 'Essential water-soluble B vitamins and elemental zinc for metabolic tissue repair')
ON DUPLICATE KEY UPDATE medicine_name='B-Complex with Zinc', category_id=7;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(38, 7, 'Calcium Carbonate + Vit D3', 'Shelcal 500', 'Calcium + Cholecalciferol', '500 mg', 'Tablet', 'Elemental calcium with vitamin D3 cofactor for bone mineralization and osteoporosis management')
ON DUPLICATE KEY UPDATE medicine_name='Calcium Carbonate + Vit D3', category_id=7;

-- Category 8: Dermatology
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(39, 8, 'Clotrimazole 1% Cream', 'Canesten', 'Clotrimazole', '1% w/w', 'Ointment', 'Broad-spectrum imidazole antifungal cream for ringworm, athlete foot, and candidiasis')
ON DUPLICATE KEY UPDATE medicine_name='Clotrimazole 1% Cream', category_id=8;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(40, 8, 'Mupirocin 2% Ointment', 'Bactroban / T-Bact', 'Mupirocin', '2% w/w', 'Ointment', 'Topical antibacterial inhibiting isoleucyl-tRNA synthetase for impetigo and MRSA lesions')
ON DUPLICATE KEY UPDATE medicine_name='Mupirocin 2% Ointment', category_id=8;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(41, 8, 'Silver Sulfadiazine Cream', 'Silvadene / Burnol', 'Silver Sulfadiazine', '1% w/w', 'Cream', 'Topical antimicrobial prophylactic and therapeutic cream for partial thickness burn wounds')
ON DUPLICATE KEY UPDATE medicine_name='Silver Sulfadiazine Cream', category_id=8;

-- Category 9: Allergy & Cold
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(42, 9, 'Cetirizine 10mg', 'Zyrtec / Cetzine', 'Cetirizine HCl', '10 mg', 'Tablet', 'Second-generation H1 receptor antagonist for seasonal allergic rhinitis and chronic urticaria')
ON DUPLICATE KEY UPDATE medicine_name='Cetirizine 10mg', category_id=9;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(43, 9, 'Levocetirizine 5mg', 'Xyzal / Vozet', 'Levocetirizine Dihydrochloride', '5 mg', 'Tablet', 'Active R-enantiomer of cetirizine providing potent antihistaminic action with minimal sedation')
ON DUPLICATE KEY UPDATE medicine_name='Levocetirizine 5mg', category_id=9;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(44, 9, 'Fexofenadine 120mg', 'Allegra', 'Fexofenadine HCl', '120 mg', 'Tablet', 'Non-sedating selective peripheral H1 receptor antagonist for allergic symptoms and hay fever')
ON DUPLICATE KEY UPDATE medicine_name='Fexofenadine 120mg', category_id=9;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(45, 9, 'Normal Saline Nasal Spray', 'Otrivin Saline', 'Sodium Chloride 0.65%', '30 ml', 'Spray', 'Isotonic nasal mist for clearing sinus congestion, crusts, and particulate allergens')
ON DUPLICATE KEY UPDATE medicine_name='Normal Saline Nasal Spray', category_id=9;

-- Category 10: First Aid
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(46, 10, 'ORS Sachet', 'Electral', 'Oral Rehydration Salts IP', '21.8 g', 'Sachet', 'WHO-formula balanced electrolyte and glucose powder for acute diarrheal dehydration')
ON DUPLICATE KEY UPDATE medicine_name='ORS Sachet', category_id=10;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(47, 10, 'Povidone Iodine 10% Solution', 'Betadine', 'Povidone Iodine', '10% w/v', 'Liquid', 'Topical microbicidal antiseptic solution for surgical pre-op skin preparation and wound disinfection')
ON DUPLICATE KEY UPDATE medicine_name='Povidone Iodine 10% Solution', category_id=10;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(48, 10, 'Hydrogen Peroxide 3%', 'CuraPerox', 'Hydrogen Peroxide', '3% w/v', 'Liquid', 'Topical debriding and cleansing agent for suppurating cuts, superficial abrasions, and sores')
ON DUPLICATE KEY UPDATE medicine_name='Hydrogen Peroxide 3%', category_id=10;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(49, 10, 'Sterile Gauze Swabs', 'MediGauze', '100% Cotton Gauze', '7.5 x 7.5 cm', 'Pack', 'Sterile high-absorbency 12-ply cotton gauze pads for wound dressing and exudate management')
ON DUPLICATE KEY UPDATE medicine_name='Sterile Gauze Swabs', category_id=10;

-- Category 11: Eye Care
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(50, 11, 'Moxifloxacin 0.5% Drops', 'Vigamox / Moxicip', 'Moxifloxacin HCl', '0.5% w/v', 'Drops', 'Fourth-generation fluoroquinolone ophthalmic solution for acute bacterial conjunctivitis')
ON DUPLICATE KEY UPDATE medicine_name='Moxifloxacin 0.5% Drops', category_id=11;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(51, 11, 'Carboxymethylcellulose 0.5%', 'Refresh Tears', 'Carboxymethylcellulose', '0.5% w/v', 'Drops', 'Artificial tear eye lubricant drops for severe dry eye syndrome and ocular surface irritation')
ON DUPLICATE KEY UPDATE medicine_name='Carboxymethylcellulose 0.5%', category_id=11;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(52, 11, 'Timolol Maleate 0.5%', 'Timoptic', 'Timolol Maleate', '0.5% w/v', 'Drops', 'Non-selective beta-adrenergic blocker ophthalmic solution for elevated intraocular pressure in glaucoma')
ON DUPLICATE KEY UPDATE medicine_name='Timolol Maleate 0.5%', category_id=11;

-- Category 12: General Medicines
INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(53, 12, 'Normal Saline 0.9% IV 500ml', 'NS 0.9%', 'Sodium Chloride Injection', '0.9% w/v', 'Infusion', 'Isotonic crystalloid intravenous solution for fluid resuscitation and electrolyte replenishment')
ON DUPLICATE KEY UPDATE medicine_name='Normal Saline 0.9% IV 500ml', category_id=12;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(54, 12, 'Dextrose 5% IV 500ml', 'D5W', 'Dextrose Anhydrous', '5% w/v', 'Infusion', 'Hypotonic carbohydrate intravenous infusion for hydration and cellular calorie replacement')
ON DUPLICATE KEY UPDATE medicine_name='Dextrose 5% IV 500ml', category_id=12;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(55, 12, 'Ringer Lactate IV 500ml', 'RL Solution', 'Sodium Lactate Compound', '500 ml', 'Infusion', 'Balanced crystalloid solution for intraoperative hypovolemia and burn shock resuscitation')
ON DUPLICATE KEY UPDATE medicine_name='Ringer Lactate IV 500ml', category_id=12;

INSERT INTO medicines (medicine_id, category_id, medicine_name, brand_name, generic_name, strength, dosage_form, description) VALUES
(56, 12, 'Sterile Water for Injection 10ml', 'SWFI', 'Sterile Water', '10 ml', 'Vial', 'Pyrogen-free sterile vehicle for reconstitution and dilution of parenteral therapeutic powders')
ON DUPLICATE KEY UPDATE medicine_name='Sterile Water for Injection 10ml', category_id=12;

-- -------------------------------------------------------------------
-- 4. Inventory Batches (Realistic Stock Levels & Multi-Horizon Expiry)
-- -------------------------------------------------------------------

-- Expired Batches (daysRemaining < 0) - Target: 4-5
INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(20, 19, 2, 'DOX-2024-X1', '2024-04-10', '2026-10-15', 500, 40, 2.50, 5.00)
ON DUPLICATE KEY UPDATE expiry_date='2026-10-15', quantity_available=40;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(21, 31, 4, 'OND-2024-X2', '2024-05-12', '2026-10-28', 400, 25, 3.20, 6.50)
ON DUPLICATE KEY UPDATE expiry_date='2026-10-28', quantity_available=25;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(22, 48, 5, 'HPX-2024-X3', '2024-03-20', '2026-10-05', 200, 15, 1.10, 2.40)
ON DUPLICATE KEY UPDATE expiry_date='2026-10-05', quantity_available=15;

-- Expiring in <= 7 Days (Critical) - Target: ~3
INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(23, 2, 1, 'AMX-2025-C7', '2025-01-15', '2026-11-09', 1000, 48, 3.40, 6.00)
ON DUPLICATE KEY UPDATE expiry_date='2026-11-09', quantity_available=48;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(24, 42, 6, 'CET-2025-C8', '2025-02-10', '2026-11-11', 800, 32, 1.20, 2.50)
ON DUPLICATE KEY UPDATE expiry_date='2026-11-11', quantity_available=32;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(25, 16, 5, 'AMX-2025-C9', '2025-01-20', '2026-11-12', 600, 28, 4.20, 7.80)
ON DUPLICATE KEY UPDATE expiry_date='2026-11-12', quantity_available=28;

-- Expiring in <= 30 Days (Warning) - Target: ~15
INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(26, 8, 2, 'VC-2024-W1', '2024-11-20', '2026-11-22', 1500, 120, 2.10, 4.20)
ON DUPLICATE KEY UPDATE expiry_date='2026-11-22', quantity_available=120;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(27, 12, 1, 'DOL-2025-W2', '2025-03-01', '2026-11-28', 2000, 180, 1.80, 3.50)
ON DUPLICATE KEY UPDATE expiry_date='2026-11-28', quantity_available=180;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(28, 17, 7, 'AZI-2025-W3', '2025-04-10', '2026-12-01', 500, 35, 8.50, 15.00)
ON DUPLICATE KEY UPDATE expiry_date='2026-12-01', quantity_available=35;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(29, 29, 3, 'PAN-2025-W4', '2025-03-15', '2026-12-03', 1200, 140, 3.60, 7.20)
ON DUPLICATE KEY UPDATE expiry_date='2026-12-03', quantity_available=140;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(30, 46, 8, 'ORS-2025-W5', '2025-02-18', '2026-12-04', 3000, 250, 0.80, 1.80)
ON DUPLICATE KEY UPDATE expiry_date='2026-12-04', quantity_available=250;

-- Low Stock Batches (Quantity <= 50) - Target: ~12
INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(31, 24, 6, 'INS-2025-LS1', '2025-06-01', '2027-04-10', 200, 14, 18.00, 32.00)
ON DUPLICATE KEY UPDATE quantity_available=14;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(32, 18, 4, 'CTX-2025-LS2', '2025-05-15', '2027-05-20', 300, 18, 12.50, 22.00)
ON DUPLICATE KEY UPDATE quantity_available=18;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(33, 33, 1, 'BUD-2025-LS3', '2025-07-01', '2027-08-15', 250, 22, 16.00, 28.50)
ON DUPLICATE KEY UPDATE quantity_available=22;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(34, 50, 11, 'MOX-2025-LS4', '2025-08-10', '2027-09-01', 400, 30, 9.20, 17.00)
ON DUPLICATE KEY UPDATE quantity_available=30;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(35, 14, 9, 'DIC-2025-LS5', '2025-04-20', '2027-06-15', 500, 42, 1.50, 3.20)
ON DUPLICATE KEY UPDATE quantity_available=42;

-- Critical Zero Stock (Quantity = 0)
INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(36, 40, 7, 'MUP-2025-ZS1', '2025-03-01', '2027-02-15', 300, 0, 7.50, 14.00)
ON DUPLICATE KEY UPDATE quantity_available=0;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(37, 52, 11, 'TIM-2025-ZS2', '2025-04-15', '2027-03-30', 250, 0, 8.00, 15.50)
ON DUPLICATE KEY UPDATE quantity_available=0;

-- Optimal Stock Batches across medicines (2027 - 2028 expiry)
INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(38, 1, 1, 'PCM-2026-OPT1', '2026-02-01', '2028-02-01', 6000, 5200, 1.15, 2.50)
ON DUPLICATE KEY UPDATE quantity_available=5200;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(39, 3, 2, 'IBU-2026-OPT2', '2026-03-10', '2028-03-10', 4000, 3600, 1.45, 3.10)
ON DUPLICATE KEY UPDATE quantity_available=3600;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(40, 5, 4, 'MTF-2026-OPT3', '2026-01-20', '2028-01-20', 5000, 4400, 1.70, 3.80)
ON DUPLICATE KEY UPDATE quantity_available=4400;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(41, 9, 3, 'AML-2026-OPT4', '2026-04-05', '2028-04-05', 3500, 3100, 2.20, 4.60)
ON DUPLICATE KEY UPDATE quantity_available=3100;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(42, 10, 3, 'ATR-2026-OPT5', '2026-02-15', '2028-02-15', 3000, 2750, 4.50, 9.20)
ON DUPLICATE KEY UPDATE quantity_available=2750;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(43, 20, 1, 'AUG-2026-OPT6', '2026-05-01', '2027-11-01', 2000, 1650, 9.80, 18.00)
ON DUPLICATE KEY UPDATE quantity_available=1650;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(44, 25, 6, 'TEL-2026-OPT7', '2026-03-22', '2028-03-22', 2500, 2100, 3.80, 7.50)
ON DUPLICATE KEY UPDATE quantity_available=2100;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(45, 27, 8, 'CLO-2026-OPT8', '2026-04-18', '2028-04-18', 2000, 1800, 6.20, 12.00)
ON DUPLICATE KEY UPDATE quantity_available=1800;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(46, 29, 5, 'PAN-2026-OPT9', '2026-01-10', '2028-01-10', 4000, 3500, 3.50, 7.00)
ON DUPLICATE KEY UPDATE quantity_available=3500;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(47, 34, 10, 'MON-2026-OPT10', '2026-02-28', '2028-02-28', 1800, 1500, 5.40, 10.50)
ON DUPLICATE KEY UPDATE quantity_available=1500;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(48, 36, 9, 'VD3-2026-OPT11', '2026-05-10', '2028-05-10', 2500, 2200, 4.20, 8.50)
ON DUPLICATE KEY UPDATE quantity_available=2200;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(49, 38, 12, 'CAL-2026-OPT12', '2026-03-15', '2028-03-15', 3000, 2600, 3.10, 6.20)
ON DUPLICATE KEY UPDATE quantity_available=2600;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(50, 44, 14, 'FEX-2026-OPT13', '2026-04-01', '2028-04-01', 2000, 1750, 4.80, 9.60)
ON DUPLICATE KEY UPDATE quantity_available=1750;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(51, 46, 5, 'ORS-2026-OPT14', '2026-01-05', '2028-01-05', 8000, 7200, 0.75, 1.80)
ON DUPLICATE KEY UPDATE quantity_available=7200;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(52, 47, 13, 'BET-2026-OPT15', '2026-03-08', '2028-03-08', 1500, 1300, 3.90, 7.80)
ON DUPLICATE KEY UPDATE quantity_available=1300;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(53, 51, 11, 'REF-2026-OPT16', '2026-02-12', '2028-02-12', 1200, 1050, 6.50, 12.50)
ON DUPLICATE KEY UPDATE quantity_available=1050;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(54, 53, 15, 'NS-2026-OPT17', '2026-05-20', '2028-05-20', 5000, 4600, 1.20, 2.80)
ON DUPLICATE KEY UPDATE quantity_available=4600;

INSERT INTO inventory_batches (batch_id, medicine_id, supplier_id, batch_number, manufacturing_date, expiry_date, quantity_received, quantity_available, purchase_cost, selling_price) VALUES
(55, 55, 15, 'RL-2026-OPT18', '2026-04-14', '2028-04-14', 4000, 3700, 1.30, 3.00)
ON DUPLICATE KEY UPDATE quantity_available=3700;

-- -------------------------------------------------------------------
-- 5. Interconnected Purchase Orders (Target: ~32 Orders across all stages)
-- Note: Created by Pharmacist user_id=2 (Alex Rivera)
-- -------------------------------------------------------------------

-- PENDING_APPROVAL (Target: 3-4 for Admin to approve/reject)
INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes) VALUES
(30, 1, 2, '2026-11-04', '2026-11-12', 'PENDING_APPROVAL', 4850.00, 'Urgent winter restock for Central Pharmacy ICU emergency reserves.')
ON DUPLICATE KEY UPDATE status='PENDING_APPROVAL', total_amount=4850.00;

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(40, 30, 1, 2000, 1.15) ON DUPLICATE KEY UPDATE quantity=2000;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(41, 30, 20, 200, 9.80) ON DUPLICATE KEY UPDATE quantity=200;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(42, 30, 33, 50, 11.80) ON DUPLICATE KEY UPDATE quantity=50;

INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes) VALUES
(31, 5, 2, '2026-11-05', '2026-11-14', 'PENDING_APPROVAL', 3240.00, 'High-demand antibiotic replenishment request from Outpatient Pharmacy.')
ON DUPLICATE KEY UPDATE status='PENDING_APPROVAL', total_amount=3240.00;

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(43, 31, 16, 600, 4.20) ON DUPLICATE KEY UPDATE quantity=600;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(44, 31, 46, 1000, 0.72) ON DUPLICATE KEY UPDATE quantity=1000;

INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes) VALUES
(32, 6, 2, '2026-11-05', '2026-11-15', 'PENDING_APPROVAL', 5400.00, 'Diabetes care insulin stock replenishment for general inpatient ward.')
ON DUPLICATE KEY UPDATE status='PENDING_APPROVAL', total_amount=5400.00;

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(45, 32, 24, 300, 18.00) ON DUPLICATE KEY UPDATE quantity=300;

-- DRAFT Orders (Pharmacist can edit & submit)
INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes) VALUES
(33, 2, 2, '2026-11-05', '2026-11-18', 'DRAFT', 2250.00, 'Draft order for seasonal Vitamin C and pediatric supplements.')
ON DUPLICATE KEY UPDATE status='DRAFT', total_amount=2250.00;

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(46, 33, 8, 1000, 2.25) ON DUPLICATE KEY UPDATE quantity=1000;

-- REJECTED Orders (with rejection_reason, Pharmacist can review & re-submit)
INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes, rejection_reason) VALUES
(34, 7, 2, '2026-10-24', '2026-11-02', 'REJECTED', 7200.00, 'Rejected on 2026-10-25 by Dr. Sarah Khan', 'Supplier quote exceeds approved hospital rate agreement by 18%. Negotiate revised commercial pricing.')
ON DUPLICATE KEY UPDATE status='REJECTED', rejection_reason=VALUES(rejection_reason);

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(47, 34, 17, 800, 9.00) ON DUPLICATE KEY UPDATE quantity=800;

INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes, rejection_reason) VALUES
(35, 4, 2, '2026-10-28', '2026-11-05', 'REJECTED', 3900.00, 'Rejected on 2026-10-29 by Dr. Sarah Khan', 'Duplicate order detected. Identical Ceftriaxone order already in transit under PO #18.')
ON DUPLICATE KEY UPDATE status='REJECTED', rejection_reason=VALUES(rejection_reason);

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(48, 35, 18, 300, 13.00) ON DUPLICATE KEY UPDATE quantity=300;

-- APPROVED Orders (Awaiting vendor dispatch)
INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes, approval_notes) VALUES
(36, 1, 2, '2026-11-01', '2026-11-08', 'APPROVED', 6900.00, 'Approved by Dr. Sarah Khan on 2026-11-02 10:15', 'Approved for urgent clinical supply fulfillment.')
ON DUPLICATE KEY UPDATE status='APPROVED', approval_notes=VALUES(approval_notes);

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(49, 36, 3, 2000, 1.45) ON DUPLICATE KEY UPDATE quantity=2000;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(50, 36, 12, 1000, 1.80) ON DUPLICATE KEY UPDATE quantity=1000;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(51, 36, 29, 600, 3.66) ON DUPLICATE KEY UPDATE quantity=600;

-- IN_TRANSIT / SHIPPED Orders (Staff can view and prepare to receive!)
INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes) VALUES
(37, 1, 2, '2026-11-02', '2026-11-06', 'IN_TRANSIT', 5100.00, 'Carrier: Fedex Medical ColdChain | Tracking #FDX-9941-IL | Dispatched from Chicago Hub')
ON DUPLICATE KEY UPDATE status='IN_TRANSIT', notes=VALUES(notes);

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(52, 37, 1, 3000, 1.15) ON DUPLICATE KEY UPDATE quantity=3000;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(53, 37, 15, 1100, 1.50) ON DUPLICATE KEY UPDATE quantity=1100;

INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes) VALUES
(38, 15, 2, '2026-11-03', '2026-11-07', 'IN_TRANSIT', 6000.00, 'Carrier: BlueDart Healthcare | Tracking #BD-2210-GA | Normal Saline and IV fluid shipment')
ON DUPLICATE KEY UPDATE status='IN_TRANSIT', notes=VALUES(notes);

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(54, 38, 53, 3000, 1.20) ON DUPLICATE KEY UPDATE quantity=3000;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(55, 38, 55, 1800, 1.33) ON DUPLICATE KEY UPDATE quantity=1800;

-- RECEIVED / DELIVERED Orders (with Goods Receipts and Stock Increase)
INSERT INTO purchase_orders (purchase_order_id, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, notes) VALUES
(39, 1, 2, '2026-10-18', '2026-10-24', 'DELIVERED', 8200.00, 'Delivered and verified at Dock 2 by Nurse Emily Watson. GRN-2026-1089 issued.')
ON DUPLICATE KEY UPDATE status='DELIVERED', notes=VALUES(notes);

INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(56, 39, 4, 1000, 3.80) ON DUPLICATE KEY UPDATE quantity=1000;
INSERT INTO purchase_order_items (purchase_order_item_id, purchase_order_id, medicine_id, quantity, unit_cost) VALUES
(57, 39, 9, 2000, 2.20) ON DUPLICATE KEY UPDATE quantity=2000;

-- -------------------------------------------------------------------
-- 6. Goods Receipts & Receiving Verification
-- -------------------------------------------------------------------
INSERT INTO goods_receipts (receipt_id, receipt_number, purchase_order_id, received_by, received_at, status, total_items, has_discrepancies, notes) VALUES
(10, 'GRN-2026-1089', 39, 3, '2026-10-24 14:30:00', 'COMPLETED', 2, 0, 'Inspected lot labels and temperature integrity at Central Receiving Bay.')
ON DUPLICATE KEY UPDATE status='COMPLETED';

INSERT INTO goods_receipt_items (receipt_item_id, receipt_id, purchase_order_item_id, medicine_id, quantity_ordered, quantity_received, batch_number, expiry_date, manufacturing_date, unit_cost) VALUES
(10, 10, 56, 4, 1000, 1000, 'OMP-2026-RC1', '2028-02-15', '2026-02-01', 3.80)
ON DUPLICATE KEY UPDATE quantity_received=1000;

INSERT INTO goods_receipt_items (receipt_item_id, receipt_id, purchase_order_item_id, medicine_id, quantity_ordered, quantity_received, batch_number, expiry_date, manufacturing_date, unit_cost) VALUES
(11, 10, 57, 9, 2000, 2000, 'AML-2026-RC2', '2028-03-20', '2026-03-01', 2.20)
ON DUPLICATE KEY UPDATE quantity_received=2000;

-- -------------------------------------------------------------------
-- 7. Stock Logs (Dispensing, Receiving, Adjustment Audits)
-- -------------------------------------------------------------------
INSERT INTO stock_logs (stock_log_id, batch_id, user_id, transaction_type, quantity_changed, quantity_before, quantity_after, reference_type, reference_id, notes) VALUES
(20, 38, 2, 'DISPENSED', -50, 5250, 5200, 'PRESCRIPTION', 99102, 'Dispensed to Post-Op Recovery Ward')
ON DUPLICATE KEY UPDATE transaction_type='DISPENSED';

INSERT INTO stock_logs (stock_log_id, batch_id, user_id, transaction_type, quantity_changed, quantity_before, quantity_after, reference_type, reference_id, notes) VALUES
(21, 39, 2, 'DISPENSED', -80, 3680, 3600, 'WARD_REQUEST', 99104, 'Emergency Department restocking')
ON DUPLICATE KEY UPDATE transaction_type='DISPENSED';

INSERT INTO stock_logs (stock_log_id, batch_id, user_id, transaction_type, quantity_changed, quantity_before, quantity_after, reference_type, reference_id, notes) VALUES
(22, 43, 3, 'RECEIVED', 2000, 0, 1650, 'GOODS_RECEIPT', 10, 'Received from Apex Medical via GRN-2026-1089')
ON DUPLICATE KEY UPDATE transaction_type='RECEIVED';

INSERT INTO stock_logs (stock_log_id, batch_id, user_id, transaction_type, quantity_changed, quantity_before, quantity_after, reference_type, reference_id, notes) VALUES
(23, 20, 1, 'QUARANTINED', -40, 40, 0, 'EXPIRY_AUDIT', 20, 'Quarantined expired batch DOX-2024-X1 for authorized supplier return')
ON DUPLICATE KEY UPDATE transaction_type='QUARANTINED';

-- -------------------------------------------------------------------
-- 8. Clinical Tasks (Staff & Pharmacist Task Queue)
-- -------------------------------------------------------------------
INSERT INTO tasks (task_id, title, description, assigned_by, assigned_to, priority, status, due_date) VALUES
(10, 'Emergency Crash Cart Physical Verification', 'Check expiration seals and count ampoules in ICU and Trauma Bay crash carts', 1, 3, 'HIGH', 'COMPLETED', '2026-11-04 12:00:00')
ON DUPLICATE KEY UPDATE status='COMPLETED';

INSERT INTO tasks (task_id, title, description, assigned_by, assigned_to, priority, status, due_date) VALUES
(11, 'Dock Receiving: Apex Medical Delivery (PO #37)', 'Perform temperature seal check and verify 4100 units at Hospital Bay 2', 1, 3, 'HIGH', 'PENDING', '2026-11-06 14:00:00')
ON DUPLICATE KEY UPDATE status='PENDING';

INSERT INTO tasks (task_id, title, description, assigned_by, assigned_to, priority, status, due_date) VALUES
(12, 'Expiry Audit: Ward Refrigerator 3', 'Review shelf-life for refrigerated biologicals and insulin pens', 2, 3, 'MEDIUM', 'IN_PROGRESS', '2026-11-07 11:00:00')
ON DUPLICATE KEY UPDATE status='IN_PROGRESS';

INSERT INTO tasks (task_id, title, description, assigned_by, assigned_to, priority, status, due_date) VALUES
(13, 'Cycle Count: Antibiotics Reserve Shelves B1-B4', 'Perform barcode count verification for Azithromycin and Amoxicillin stock', 2, 3, 'MEDIUM', 'PENDING', '2026-11-08 16:30:00')
ON DUPLICATE KEY UPDATE status='PENDING';

INSERT INTO tasks (task_id, title, description, assigned_by, assigned_to, priority, status, due_date) VALUES
(14, 'Review PO #31 High-Value Supplier Quote', 'Compare Sri Medical quote with annual procurement matrix before Admin signoff', 1, 2, 'MEDIUM', 'COMPLETED', '2026-11-05 17:00:00')
ON DUPLICATE KEY UPDATE status='COMPLETED';

-- -------------------------------------------------------------------
-- 9. Stock Discrepancies (Floor Verification Audits)
-- -------------------------------------------------------------------
INSERT INTO stock_discrepancies (discrepancy_id, batch_id, medicine_id, expected_quantity, counted_quantity, discrepancy, reason, reported_by, status, created_at) VALUES
(1, 23, 2, 50, 48, -2, 'Two capsules damaged during morning ward transit; discarded per clinical biohazard guidelines.', 3, 'RESOLVED', '2026-11-04 09:30:00')
ON DUPLICATE KEY UPDATE status='RESOLVED';

INSERT INTO stock_discrepancies (discrepancy_id, batch_id, medicine_id, expected_quantity, counted_quantity, discrepancy, reason, reported_by, status, created_at) VALUES
(2, 27, 12, 185, 180, -5, 'Physical recount difference identified on Pediatric Ward shelf A2. Investigating dispensing log.', 3, 'PENDING', '2026-11-05 14:15:00')
ON DUPLICATE KEY UPDATE status='PENDING';

INSERT INTO stock_discrepancies (discrepancy_id, batch_id, medicine_id, expected_quantity, counted_quantity, discrepancy, reason, reported_by, status, created_at) VALUES
(3, 46, 29, 3500, 3500, 0, 'Routine quarterly count: verified exact physical balance against system ledger.', 3, 'RESOLVED', '2026-11-03 11:00:00')
ON DUPLICATE KEY UPDATE status='RESOLVED';

-- -------------------------------------------------------------------
-- 10. Role-Targeted Notifications
-- -------------------------------------------------------------------
-- Admin (user_id = 1)
INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(100, 1, 'New Purchase Order Submitted', 'Pharmacist Alex Rivera submitted PO #30 for Admin review (Total: ₹4,850.00).', 'PURCHASE_ORDER', 0, 'HIGH', '2026-11-04 15:30:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(101, 1, 'New Purchase Order Submitted', 'Pharmacist Alex Rivera submitted PO #31 for Admin review (Total: ₹3,240.00).', 'PURCHASE_ORDER', 0, 'HIGH', '2026-11-05 10:15:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(102, 1, 'Stock Discrepancy Reported', 'Staff Nurse Emily Watson reported a discrepancy of -5 units on Dolo 650mg.', 'STOCK_ALERT', 0, 'NORMAL', '2026-11-05 14:15:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Pharmacist (user_id = 2)
INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(103, 2, 'Purchase Order Approved', 'Your PO #36 has been approved by Administrator Dr. Sarah Khan for procurement.', 'PURCHASE_ORDER', 0, 'HIGH', '2026-11-02 10:15:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(104, 2, 'Purchase Order Rejected', 'Your PO #34 was rejected by Admin. Reason: Supplier quote exceeds approved rate cap.', 'PURCHASE_ORDER', 0, 'HIGH', '2026-10-25 11:20:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(105, 2, 'Critical Expiry Alert', 'Amoxicillin 250mg (Batch AMX-2025-C7) expires in 4 days. Please initiate shelf clearance.', 'EXPIRY_ALERT', 0, 'HIGH', '2026-11-05 08:00:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Staff (user_id = 3)
INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(106, 3, 'Delivery In Transit', 'Apex Medical Supplies PO #37 is en route to Bay 2. Prepare receiving verification.', 'DELIVERY', 0, 'HIGH', '2026-11-05 09:30:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(107, 3, 'New Task Assigned', 'You have been assigned: Emergency Crash Cart Physical Verification.', 'TASK_ASSIGNED', 1, 'NORMAL', '2026-11-04 08:30:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Supplier (user_id = 6)
INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(108, 6, 'Purchase Order Ready for Dispatch', 'Hospital Purchase Order #36 has been authorized. Please confirm shipment timeline.', 'PURCHASE_ORDER', 0, 'HIGH', '2026-11-02 11:00:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);

SET FOREIGN_KEY_CHECKS = 1;

