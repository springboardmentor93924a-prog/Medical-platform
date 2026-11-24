package com.medistock.medistock.dto.audit;

import java.time.LocalDateTime;

public class AuditFilterRequest {
    private String search;
    private String role;
    private String module;
    private String action;
    private String status;
    private Integer userId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public AuditFilterRequest() {}

    public String getSearch() { return search; }
    public void setSearch(String search) { this.search = search; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
}
