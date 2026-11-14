package com.medistock.service;

import com.medistock.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    void log(String userEmail, String userRole, String action, String entityName, String entityId, String details);
    Page<AuditLog> getAuditLogs(Pageable pageable);
}
