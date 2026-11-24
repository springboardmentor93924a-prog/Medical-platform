-- V3: Create AI Inventory Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT(11) NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL,
    current_stock DECIMAL(12,2),
    recommended_quantity DECIMAL(12,2),
    risk_level VARCHAR(20),
    explanation TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recommendation_medicine (medicine_id),
    INDEX idx_recommendation_status (status),
    CONSTRAINT fk_recommendation_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
