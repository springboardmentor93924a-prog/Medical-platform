-- V5: Create AI Model Metrics and Tool Execution Logs Tables
CREATE TABLE IF NOT EXISTS ai_model_metrics (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    mae DECIMAL(12,4),
    rmse DECIMAL(12,4),
    mape DECIMAL(12,4),
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_tool_logs (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    execution_status VARCHAR(30),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tool_user (user_id),
    INDEX idx_tool_name (tool_name),
    CONSTRAINT fk_tool_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
