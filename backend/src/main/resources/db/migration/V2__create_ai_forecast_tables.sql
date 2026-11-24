-- V2: Create AI Demand Forecast Results Table
CREATE TABLE IF NOT EXISTS forecast_results (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT(11) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_horizon INT(11) NOT NULL,
    predicted_quantity DECIMAL(12,2) NOT NULL,
    lower_bound DECIMAL(12,2),
    upper_bound DECIMAL(12,2),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    data_as_of TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_forecast_medicine (medicine_id),
    INDEX idx_forecast_date (forecast_date),
    CONSTRAINT fk_forecast_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
