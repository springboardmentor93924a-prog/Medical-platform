-- Migration: Fix Feedback Category and Status Column Types
-- Converts ENUM columns to VARCHAR to prevent 'Data truncated for column' errors
-- Preserves all existing feedback records including 'SERVICE_QUALITY'

ALTER TABLE feedback MODIFY COLUMN category VARCHAR(50) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE feedback MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED';
