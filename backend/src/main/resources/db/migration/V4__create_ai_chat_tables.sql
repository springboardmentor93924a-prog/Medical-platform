-- V4: Create AI Chat Sessions and Messages Tables
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    session_title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_chat_user (user_id),
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    session_id INT(11) NOT NULL,
    sender VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    provider_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_message_session (session_id),
    CONSTRAINT fk_chat_message_session FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
