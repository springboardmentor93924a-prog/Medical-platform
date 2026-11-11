-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: medistock
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES 
(1,'Tablets','Tablet medicines'),
(2,'Antibiotics','Antibiotic medicines'),
(3,'Analgesics','Pain relief medicines'),
(4,'Cardiovascular','Heart and blood pressure medicines'),
(5,'Antacids','Acidity and digestive medicines'),
(6,'Syrups','Liquid medicines'),
(7,'Injections','Injectable medicines'),
(8,'Other','Other medicine categories');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'Admin'),(2,'Pharmacist'),(3,'Staff'),(4,'Supplier');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`user_id`, `name`, `username`, `email`, `password`, `phone`, `role_id`, `is_active`) VALUES 
(1,'MediStock Admin','admin','admin@medistock.com','$2a$10$5/A8mJJGIUtEicALGBHmbOymyIV4fHVh1l9pFAqxzea.xsfP8A2ty','9876543210',1,1),
(2,'Test Staff','staff.test','staff.test@medistock.com','$2a$10$ENHNqhBveQXudFF17XwdceztzqKUQKPCDS6AFrHki7mxumqHKR0K2','9876501234',3,1),
(3,'staff mem1','Staff','Staff@123.com','$2a$10$pqBjkVw6SAVhtDWrXG09c.rILG66CkdZ9O3v4qO8tGQgJ/ReCoTCO',NULL,3,1),
(4,'Test Supplier','supplier.test','supplier.test@medistock.com','$2a$10$Idi8E9ei15pMDN2ZYYFtMu6cp29y06YTQNa4kPPzDiLUJZEmGOdFe',NULL,4,1),
(5,'Pharamcist Test','pharmacist.test','pharmacist.test@medistock.com','$2a$10$bEw.o6m2w3PVwf9kc66Nz.zoX3.U1CSMeNKfYv/ff.FpEF38yLVm6',NULL,2,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(150) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text,
  PRIMARY KEY (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
INSERT INTO `supplier` VALUES 
(1,'Apex Healthcare Logistics','Rajesh Sharma','+91 98200 11223','orders@apexhealth.com','Plot 42, GIDC Industrial Estate, Ahmedabad, Gujarat'),
(2,'MedLife Pharma Dist','Priya Menon','+91 98450 33445','supply@medlifepharma.in','12/A Electronic City Phase 1, Bangalore, Karnataka'),
(3,'Global Care Lifesciences','Dr. Vikram Seth','+91 98110 55667','procurement@globalcare.org','78 Nehru Place Commercial Complex, New Delhi'),
(4,'Sunlight BioMed Supplies','Ananya Patel','+91 97230 77889','distribution@sunlightbiomed.com','305 Andheri East Kurla Road, Mumbai, Maharashtra');
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine`
--

DROP TABLE IF EXISTS `medicine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicine` (
  `medicine_id` int NOT NULL AUTO_INCREMENT,
  `medicine_code` varchar(50) DEFAULT NULL,
  `medicine_name` varchar(150) NOT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `manufacturer` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text,
  `uses` text,
  `dosage` varchar(100) DEFAULT NULL,
  `side_effects` text,
  `precautions` text,
  `prescription_required` tinyint(1) DEFAULT '0',
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`medicine_id`),
  UNIQUE KEY `uk_medicine_code` (`medicine_code`),
  KEY `fk_medicine_category` (`category_id`),
  CONSTRAINT `fk_medicine_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine`
--

LOCK TABLES `medicine` WRITE;
/*!40000 ALTER TABLE `medicine` DISABLE KEYS */;
INSERT INTO `medicine` VALUES 
(1,'MED-TAB-001','Paracetamol 650mg','Acetaminophen','GlaxoSmithKline','Tablets','Analgesic and antipyretic medication for fever and mild to moderate pain relief.','Fever, mild pain, headache, dental pain','650mg every 4-6 hours as needed (max 4g/day)','Rare: liver toxicity in overdose, allergic rash','Do not exceed maximum daily dose. Avoid alcohol.',0,1),
(2,'MED-ANT-002','Amoxicillin 500mg','Amoxicillin Trihydrate','Cipla Ltd','Antibiotics','Broad-spectrum penicillin-class antibiotic for bacterial infections.','Respiratory tract infections, ear infections, urinary infections','500mg three times daily for 7-10 days','Diarrhea, nausea, skin rash','Complete the full prescribed course. Check penicillin allergy.',1,2),
(3,'MED-CRD-003','Atorvastatin 20mg','Atorvastatin Calcium','Pfizer India','Cardiovascular','HMG-CoA reductase inhibitor (statin) used to lower cholesterol and reduce cardiovascular risk.','Hypercholesterolemia, dyslipidemia, coronary heart disease prevention','20mg once daily at bedtime','Muscle ache, elevated liver enzymes, headache','Monitor liver function tests periodically. Avoid grapefruit juice.',1,4),
(4,'MED-ACD-004','Omeprazole 20mg','Omeprazole Magnesium','Dr. Reddy Laboratories','Antacids','Proton pump inhibitor reducing stomach acid production for GERD and peptic ulcers.','Gastroesophageal reflux (GERD), heartburn, gastric ulcers','20mg once daily before breakfast','Headache, abdominal pain, diarrhea','Swallow whole with water; do not crush or chew capsules.',0,5),
(5,'MED-ANT-005','Azithromycin 500mg','Azithromycin Dihydrate','Sun Pharma Ltd','Antibiotics','Macrolide antibiotic active against respiratory and soft tissue bacterial infections.','Community-acquired pneumonia, sinusitis, bronchitis','500mg once daily for 3-5 days','Abdominal cramps, loose stools, nausea','Take on an empty stomach 1 hour before or 2 hours after meals.',1,2),
(6,'MED-SYR-006','Benadryl Cough Syrup 100ml','Diphenhydramine HCl & Ammonium Chloride','Johnson & Johnson','Syrups','Expectorant and cough suppressant syrup for allergic and productive coughs.','Dry cough, chest congestion, throat irritation','10ml three times daily after food','Drowsiness, dry mouth, mild dizziness','Do not drive or operate machinery after consumption.',0,6),
(7,'MED-INJ-007','Insulin Glargine 100 IU/ml','Insulin Glargine','Sanofi Aventis','Injections','Long-acting basal insulin analogue for glycemic control in diabetes mellitus.','Type 1 and Type 2 diabetes mellitus','Subcutaneous injection once daily at the same time','Hypoglycemia, injection site reactions, weight gain','Rotate injection sites. Keep refrigerated (2-8°C). Do not freeze.',1,7),
(8,'MED-ANA-008','Ibuprofen 400mg','Ibuprofen','Abbott India','Analgesics','Non-steroidal anti-inflammatory drug (NSAID) for inflammation, arthritis, and acute pain.','Body aches, osteoarthritis, acute headache, post-operative swelling','400mg every 8 hours with meals','Gastric irritation, nausea, heartburn','Always take with or after meals. Avoid in active peptic ulcer disease.',0,3);
/*!40000 ALTER TABLE `medicine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicine_batch`
--

DROP TABLE IF EXISTS `medicine_batch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicine_batch` (
  `batch_id` int NOT NULL AUTO_INCREMENT,
  `medicine_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `batch_number` varchar(100) NOT NULL,
  `manufacturing_date` date DEFAULT NULL,
  `expiry_date` date NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `rack_location` varchar(50) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `reorder_level` int NOT NULL DEFAULT '10',
  PRIMARY KEY (`batch_id`),
  UNIQUE KEY `medicine_id` (`medicine_id`,`batch_number`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `medicine_batch_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`),
  CONSTRAINT `medicine_batch_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicine_batch`
--

LOCK TABLES `medicine_batch` WRITE;
/*!40000 ALTER TABLE `medicine_batch` DISABLE KEYS */;
INSERT INTO `medicine_batch` VALUES 
(1,1,1,'PCM-2025-01','2025-01-10','2027-01-15',350,1.20,'A1-04',2.50,50),
(2,2,2,'AMX-2025-02','2025-02-01','2027-02-28',180,6.50,'B2-11',12.00,30),
(3,3,3,'ATV-2024-09','2024-09-15','2026-11-20',8,14.00,'C3-02',22.50,15),
(4,4,1,'OMP-2024-11','2024-11-05','2026-12-10',12,3.80,'D1-09',7.50,20),
(5,5,2,'AZI-2025-03','2025-03-20','2027-06-30',220,18.00,'B1-05',32.00,25),
(6,6,4,'BND-2025-04','2025-04-12','2027-04-15',65,45.00,'E2-14',75.00,15),
(7,7,3,'INS-2025-01','2025-01-25','2026-11-15',4,320.00,'FRIDGE-01',450.00,10),
(8,8,4,'IBU-2024-02','2024-02-10','2026-08-30',0,2.10,'A2-08',4.50,20);
/*!40000 ALTER TABLE `medicine_batch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order`
--

DROP TABLE IF EXISTS `purchase_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order` (
  `purchase_order_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_date` date NOT NULL,
  `status` varchar(30) DEFAULT 'PENDING',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`purchase_order_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `purchase_order_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  CONSTRAINT `purchase_order_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order`
--

LOCK TABLES `purchase_order` WRITE;
/*!40000 ALTER TABLE `purchase_order` DISABLE KEYS */;
INSERT INTO `purchase_order` VALUES 
(1,1,1,'2026-10-15','RECEIVED',600.00),
(2,2,1,'2026-10-18','APPROVED',1800.00),
(3,3,5,'2026-10-22','SHIPPED',3200.00),
(4,4,2,'2026-10-25','PENDING',900.00);
/*!40000 ALTER TABLE `purchase_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_item`
--

DROP TABLE IF EXISTS `purchase_order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_item` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int NOT NULL,
  `medicine_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `medicine_id` (`medicine_id`),
  CONSTRAINT `purchase_order_item_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_order` (`purchase_order_id`),
  CONSTRAINT `purchase_order_item_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicine` (`medicine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_item`
--

LOCK TABLES `purchase_order_item` WRITE;
/*!40000 ALTER TABLE `purchase_order_item` DISABLE KEYS */;
INSERT INTO `purchase_order_item` VALUES 
(1,1,1,500,1.20),
(2,2,5,100,18.00),
(3,3,7,10,320.00),
(4,4,6,20,45.00);
/*!40000 ALTER TABLE `purchase_order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `sale_id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `user_id` int DEFAULT NULL,
  `sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(30) DEFAULT NULL,
  `payment_status` varchar(30) NOT NULL DEFAULT 'PAID',
  `customer_name` varchar(150) DEFAULT NULL,
  `customer_phone` varchar(30) DEFAULT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`sale_id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES 
(1,'INV-2026-1001',1,'2026-10-24 10:15:00',50.00,'CASH','PAID','Ramesh Verma','9822012345',0.00),
(2,'INV-2026-1002',5,'2026-10-25 14:30:00',150.00,'UPI','PAID','Sneha Kulkarni','9899123456',10.00),
(3,'INV-2026-1003',2,'2026-10-26 11:00:00',75.00,'CARD','PAID','Amit Sengupta','9877054321',0.00);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_item`
--

DROP TABLE IF EXISTS `sale_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_item` (
  `sale_item_id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`sale_item_id`),
  KEY `sale_id` (`sale_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `sale_item_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`sale_id`),
  CONSTRAINT `sale_item_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batch` (`batch_id`),
  CONSTRAINT `sale_item_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_item`
--

LOCK TABLES `sale_item` WRITE;
/*!40000 ALTER TABLE `sale_item` DISABLE KEYS */;
INSERT INTO `sale_item` VALUES 
(1,1,1,20,2.50,50.00),
(2,2,2,10,12.00,120.00),
(3,2,1,16,2.50,40.00),
(4,3,6,1,75.00,75.00);
/*!40000 ALTER TABLE `sale_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_log`
--

DROP TABLE IF EXISTS `stock_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_log` (
  `stock_log_id` int NOT NULL AUTO_INCREMENT,
  `batch_id` int NOT NULL,
  `user_id` int NOT NULL,
  `change_type` varchar(20) NOT NULL,
  `quantity_changed` int NOT NULL,
  `date_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `remarks` text,
  PRIMARY KEY (`stock_log_id`),
  KEY `batch_id` (`batch_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `stock_log_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batch` (`batch_id`),
  CONSTRAINT `stock_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_log`
--

LOCK TABLES `stock_log` WRITE;
/*!40000 ALTER TABLE `stock_log` DISABLE KEYS */;
INSERT INTO `stock_log` VALUES 
(1,1,1,'PURCHASE_RECEIPT',350,'2026-10-15 11:00:00','Stock received against PO-0001 from Apex Healthcare'),
(2,2,1,'PURCHASE_RECEIPT',180,'2026-10-18 15:30:00','Stock intake batch AMX-2025-02 from MedLife Pharma'),
(3,1,1,'SALE_DISPATCH',-20,'2026-10-24 10:15:00','Dispensed under invoice INV-2026-1001'),
(4,3,5,'AUDIT_ADJUSTMENT',-2,'2026-10-25 09:20:00','Routine physical count verification adjustment'),
(5,2,5,'SALE_DISPATCH',-10,'2026-10-25 14:30:00','Dispensed under invoice INV-2026-1002'),
(6,6,2,'SALE_DISPATCH',-1,'2026-10-26 11:00:00','Dispensed under invoice INV-2026-1003');
/*!40000 ALTER TABLE `stock_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `notification_type` varchar(50) DEFAULT NULL,
  `message` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `notification_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batch` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES 
(1,1,3,'LOW_STOCK','Atorvastatin 20mg (Batch ATV-2024-09) has only 8 units remaining, below reorder threshold of 15.','2026-10-25 09:30:00',0),
(2,1,7,'EXPIRY_ALERT','Insulin Glargine 100 IU/ml (Batch INS-2025-01) reaches expiration within 30 days.','2026-10-25 10:00:00',0),
(3,1,4,'LOW_STOCK','Omeprazole 20mg (Batch OMP-2024-11) has reached reorder level (12 units remaining).','2026-10-26 08:00:00',0),
(4,1,NULL,'PROCUREMENT','Purchase Order PO-0003 for Insulin Glargine has been shipped by Global Care.','2026-10-26 09:15:00',1);
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `message_text` text NOT NULL,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`message_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `message_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `message_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES 
(1,1,5,'Hello Dr. Pharmacist, please verify the stock levels for insulin and statins today.','2026-10-25 08:30:00',1),
(2,5,1,'Good morning! Yes, Atorvastatin is down to 8 boxes and Insulin is near expiry. I have initiated PO-0003.','2026-10-25 08:45:00',1),
(3,1,5,'Excellent. The purchase order has been approved and sent to Global Care Lifesciences.','2026-10-25 09:00:00',1),
(4,2,1,'Admin, we need new thermal receipt paper rolls for POS counter 2.','2026-10-26 10:05:00',0),
(5,4,1,'Greetings! PO-0002 for Azithromycin has been processed and is scheduled for dispatch tomorrow.','2026-10-26 11:20:00',0);
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `report_type` varchar(100) DEFAULT NULL,
  `generated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `file_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`report_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `report_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report`
--

LOCK TABLES `report` WRITE;
/*!40000 ALTER TABLE `report` DISABLE KEYS */;
INSERT INTO `report` VALUES 
(1,1,'INVENTORY_AUDIT','2026-10-25 18:00:00','/reports/inventory-audit-2026-10.pdf'),
(2,1,'FINANCIAL_SALES','2026-10-25 18:30:00','/reports/sales-summary-2026-10.pdf');
/*!40000 ALTER TABLE `report` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-26 14:15:00
