package com.medistock.medistock.ai.entity;

import com.medistock.medistock.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_tool_logs")
public class AIToolLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "tool_name", nullable = false, length = 100)
    private String toolName;

    @Column(name = "execution_status", length = 30)
    private String executionStatus; // SUCCESS, FORBIDDEN, FAILED, TIMEOUT

    @Column(name = "executed_at", insertable = false, updatable = false)
    private LocalDateTime executedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    public AIToolLog() {
    }

    public AIToolLog(Integer userId, String toolName, String executionStatus) {
        this.userId = userId;
        this.toolName = toolName;
        this.executionStatus = executionStatus;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getToolName() {
        return toolName;
    }

    public void setToolName(String toolName) {
        this.toolName = toolName;
    }

    public String getExecutionStatus() {
        return executionStatus;
    }

    public void setExecutionStatus(String executionStatus) {
        this.executionStatus = executionStatus;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
