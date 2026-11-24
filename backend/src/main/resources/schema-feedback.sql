-- ============================================================================
-- MediStock – Advanced Four-Role Feedback Management & Issue Resolution Schema
-- Database: medistock (MariaDB / MySQL on port 3307)
-- Supports Admin, Pharmacist, Staff, and Supplier roles
-- ============================================================================

-- 1. Feedback Tickets Table
CREATE TABLE IF NOT EXISTS `feedback_tickets` (
    `ticket_id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_number` VARCHAR(32) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_INFORMATION', 'RESOLVED', 'CLOSED', 'REJECTED', 'REOPENED') NOT NULL DEFAULT 'SUBMITTED',
    `submitted_by` INT NOT NULL,
    `source_role` VARCHAR(32) NOT NULL DEFAULT 'STAFF',
    `assigned_to` INT NULL,
    `related_module` VARCHAR(100) NULL,
    `resolution_notes` TEXT NULL,
    `reopen_reason` TEXT NULL,
    `deadline_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `resolved_at` DATETIME NULL,
    `closed_at` DATETIME NULL,
    INDEX `idx_fb_ticket_number` (`ticket_number`),
    INDEX `idx_fb_submitted_by` (`submitted_by`),
    INDEX `idx_fb_assigned_to` (`assigned_to`),
    INDEX `idx_fb_status` (`status`),
    INDEX `idx_fb_priority` (`priority`),
    INDEX `idx_fb_category` (`category`),
    INDEX `idx_fb_source_role` (`source_role`),
    INDEX `idx_fb_created_at` (`created_at`),
    CONSTRAINT `fk_fb_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fb_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Feedback Messages (Ticket Conversations)
CREATE TABLE IF NOT EXISTS `feedback_messages` (
    `message_id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `sender_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `message_type` VARCHAR(32) NOT NULL DEFAULT 'USER_MESSAGE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `read_at` DATETIME NULL,
    INDEX `idx_fbm_ticket_id` (`ticket_id`),
    INDEX `idx_fbm_sender_id` (`sender_id`),
    CONSTRAINT `fk_fbm_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `feedback_tickets` (`ticket_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fbm_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Feedback Attachments
CREATE TABLE IF NOT EXISTS `feedback_attachments` (
    `attachment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `message_id` INT NULL,
    `uploaded_by` INT NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `stored_filename` VARCHAR(255) NOT NULL,
    `file_type` VARCHAR(100) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `storage_location` VARCHAR(500) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fba_ticket_id` (`ticket_id`),
    INDEX `idx_fba_message_id` (`message_id`),
    CONSTRAINT `fk_fba_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `feedback_tickets` (`ticket_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fba_message` FOREIGN KEY (`message_id`) REFERENCES `feedback_messages` (`message_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_fba_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Feedback Status History
CREATE TABLE IF NOT EXISTS `feedback_status_history` (
    `history_id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `old_status` VARCHAR(32) NULL,
    `new_status` VARCHAR(32) NOT NULL,
    `changed_by` INT NOT NULL,
    `change_reason` VARCHAR(500) NULL,
    `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fbsh_ticket_id` (`ticket_id`),
    CONSTRAINT `fk_fbsh_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `feedback_tickets` (`ticket_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fbsh_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Feedback Ratings (Post-resolution confirmation & 1-5 star ratings)
CREATE TABLE IF NOT EXISTS `feedback_ratings` (
    `rating_id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL UNIQUE,
    `rated_by` INT NOT NULL,
    `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `comments` TEXT NULL,
    `issue_resolved` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fbr_ticket_id` (`ticket_id`),
    CONSTRAINT `fk_fbr_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `feedback_tickets` (`ticket_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fbr_user` FOREIGN KEY (`rated_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Feedback Internal Notes (ADMIN-ONLY private notes)
CREATE TABLE IF NOT EXISTS `feedback_internal_notes` (
    `note_id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `admin_id` INT NOT NULL,
    `note` TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fbin_ticket_id` (`ticket_id`),
    CONSTRAINT `fk_fbin_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `feedback_tickets` (`ticket_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fbin_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Feedback Tickets across all four roles for immediate operational visibility
INSERT INTO `feedback_tickets` 
(`ticket_id`, `ticket_number`, `title`, `description`, `category`, `priority`, `status`, `submitted_by`, `source_role`, `assigned_to`, `related_module`, `created_at`, `deadline_at`)
VALUES
(1, 'MED-FB-000001', 'Stock quantity discrepancy in Paracetamol 500mg Batch B-2024-001', 'Physical inventory count in Central Pharmacy indicates 420 strips remaining, while the system shows 480 available. Please investigate physical vs ledger allocation.', 'Inventory Issues', 'HIGH', 'IN_PROGRESS', 2, 'PHARMACIST', 1, 'Stock Management', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY)),
(2, 'MED-FB-000002', 'Damage reported during goods receiving on Delivery DEL-8812', 'Two cartons of Amoxicillin 250mg suspension were found soaked and leaking upon unloading at Dock 1. Damaged units were quarantined immediately.', 'Wastage Management Issues', 'CRITICAL', 'ASSIGNED', 3, 'STAFF', 2, 'Receive Medicines', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY)),
(3, 'MED-FB-000003', 'Delivery transit delay notification for PO-2026-089', 'Severe highway transport congestion near Northern Corridor will delay delivery of surgical antiseptics by approximately 24 hours. Estimated delivery updated.', 'Supplier Issues', 'MEDIUM', 'UNDER_REVIEW', 6, 'SUPPLIER', 1, 'Purchase Orders', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_ADD(NOW(), INTERVAL 3 DAY)),
(4, 'MED-FB-000004', 'FEFO recommendation policy enhancement request', 'Recommend setting a configurable buffer threshold of 60 days before batches enter urgent FEFO picking status for seasonal antibiotics.', 'FEFO Issues', 'LOW', 'RESOLVED', 1, 'ADMIN', NULL, 'FEFO Inventory', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL)
ON DUPLICATE KEY UPDATE `ticket_number` = VALUES(`ticket_number`);

-- Seed sample conversation messages
INSERT INTO `feedback_messages` (`ticket_id`, `sender_id`, `message`, `message_type`, `created_at`)
VALUES
(1, 2, 'Physical inventory count in Central Pharmacy indicates 420 strips remaining, while the system shows 480 available. Please investigate physical vs ledger allocation.', 'USER_MESSAGE', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 1, 'Investigation opened. We have flagged Batch B-2024-001 and assigned stock verification to the warehouse team.', 'ADMIN_RESPONSE', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 2, 'Thank you Dr. Sarah. We will hold dispensing from this batch until verified.', 'USER_MESSAGE', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 3, 'Two cartons of Amoxicillin 250mg suspension were found soaked and leaking upon unloading at Dock 1. Damaged units quarantined.', 'USER_MESSAGE', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 1, 'Assigned to Alex Rivera for wastage logging and insurance claim filing with supplier.', 'ADMIN_RESPONSE', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(3, 6, 'Severe highway transport congestion near Northern Corridor will delay delivery of surgical antiseptics by approximately 24 hours.', 'USER_MESSAGE', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(4, 1, 'FEFO recommendation policy buffer threshold of 60 days reviewed and approved in system settings.', 'ADMIN_RESPONSE', DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE `message` = VALUES(`message`);

-- Seed sample internal note (ADMIN ONLY)
INSERT INTO `feedback_internal_notes` (`ticket_id`, `admin_id`, `note`, `created_at`)
VALUES
(1, 1, 'Internal Note: Warehouse log reveals 60 units were reserved for ER trauma ward yesterday evening but not yet decremented from batch total.', DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE `note` = VALUES(`note`);

-- Seed sample resolution rating
INSERT INTO `feedback_ratings` (`ticket_id`, `rated_by`, `rating`, `comments`, `issue_resolved`, `created_at`)
VALUES
(4, 1, 5, 'Buffer threshold was implemented quickly and works as expected across all batch pick lists.', 1, DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE `rating` = VALUES(`rating`);

