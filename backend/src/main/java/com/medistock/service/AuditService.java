package com.medistock.service;

import com.medistock.entity.AuditLog;
import com.medistock.entity.User;
import com.medistock.repository.AuditLogRepository;
import com.medistock.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditService(AuditLogRepository auditLogRepository,
                        UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    public void record(String action, String entityType,
                       Long entityId, String summary) {
        Authentication auth = SecurityContextHolder.getContext()
                .getAuthentication();
        String email = auth == null ? null : auth.getName();
        record(action, entityType, entityId, summary, email);
    }

    public void record(String action, String entityType,
                       Long entityId, String summary, String email) {
        try {
            Long userId = null;

            if (email != null) {
                userId = userRepository.findByEmail(email)
                        .map(User::getUserId)
                        .orElse(null);
            }

            AuditLog log = new AuditLog();
            log.setUserId(userId);
            log.setAction(action);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setSummary(truncate(summary, 255));
            log.setPerformedBy(email);

            auditLogRepository.save(log);
        } catch (Exception ignored) {
            // Audit logging must never break the main operation
        }
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
