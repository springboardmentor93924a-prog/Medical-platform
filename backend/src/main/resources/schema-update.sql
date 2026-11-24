-- ===================================================================
-- MediStock — Database Role and User Setup
-- Ensures all 4 roles (Admin, Pharmacist, Staff, Supplier) exist
-- and verified user accounts are provisioned with BCrypt password hashes
-- ===================================================================

-- 1. Ensure all 4 standard roles exist
INSERT INTO roles (role_id, role_name, description) 
VALUES (1, 'Admin', 'Full system administration')
ON DUPLICATE KEY UPDATE role_name='Admin';

INSERT INTO roles (role_id, role_name, description) 
VALUES (2, 'Pharmacist', 'Medicine inventory and stock management')
ON DUPLICATE KEY UPDATE role_name='Pharmacist';

INSERT INTO roles (role_id, role_name, description) 
VALUES (3, 'Staff', 'Basic inventory operations')
ON DUPLICATE KEY UPDATE role_name='Staff';

INSERT INTO roles (role_id, role_name, description) 
VALUES (4, 'Supplier', 'External medical supplier and delivery management')
ON DUPLICATE KEY UPDATE role_name='Supplier';

-- 2. Update Admin user (password: password123)
UPDATE users 
SET password_hash='$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', is_active=1 
WHERE email='admin@medistock.com';

-- 3. Provision Pharmacist user (password: password123)
INSERT INTO users (role_id, full_name, email, username, password_hash, is_active)
VALUES (2, 'Alex Rivera', 'pharmacist@medistock.com', 'pharmacist', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', 1)
ON DUPLICATE KEY UPDATE password_hash='$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', is_active=1, role_id=2;

-- 4. Provision Staff user (password: password123)
INSERT INTO users (role_id, full_name, email, username, password_hash, is_active)
VALUES (3, 'Nurse Emily Watson', 'staff@medistock.com', 'staff', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', 1)
ON DUPLICATE KEY UPDATE password_hash='$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', is_active=1, role_id=3;

-- 5. Provision Supplier user (password: password123)
INSERT INTO users (role_id, full_name, email, username, password_hash, is_active)
VALUES (4, 'Apex Medical Supplies Ltd', 'supplier@medistock.com', 'supplier', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', 1)
ON DUPLICATE KEY UPDATE password_hash='$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', is_active=1, role_id=4;

-- 6. Inactive Account for testing rejection (password: password123)
INSERT INTO users (role_id, full_name, email, username, password_hash, is_active)
VALUES (3, 'Inactive Account', 'inactive@medistock.com', 'inactive_user', '$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', 0)
ON DUPLICATE KEY UPDATE password_hash='$2a$10$.HpwEbRlkwmLXs0nv78WbuXJBznu/daNmfkn9fJfzJimU4OyV4VzK', is_active=0;
