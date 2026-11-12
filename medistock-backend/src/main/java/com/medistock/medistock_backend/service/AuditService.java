package com.medistock.medistock_backend.service;

import com.medistock.medistock_backend.entity.AuditLog;
import com.medistock.medistock_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an action performed by the current logged-in user.
     */
    public void log(String action, String entityType, Long entityId, String details) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null && auth.getName() != null) ? auth.getName() : "SYSTEM";

            String role = "UNKNOWN";
            if (auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
                role = auth.getAuthorities().iterator().next().getAuthority()
                        .replace("ROLE_", "");
            }

            AuditLog log = new AuditLog();
            log.setUserEmail(email);
            log.setUserRole(role);
            log.setAction(action);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setDetails(details);

            auditLogRepository.save(log);
        } catch (Exception e) {
            // Audit failures should never break the main operation
            System.err.println("Audit log failed: " + e.getMessage());
        }
    }
}