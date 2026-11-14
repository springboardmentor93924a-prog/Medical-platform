package com.medistock.service.impl;

import com.medistock.entity.AuditLog;
import com.medistock.repository.AuditLogRepository;
import com.medistock.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void log(String userEmail, String userRole, String action, String entityName, String entityId, String details) {
        AuditLog auditLog = new AuditLog(userEmail, userRole, action, entityName, entityId, details, "127.0.0.1");
        auditLogRepository.save(auditLog);
    }

    @Override
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
