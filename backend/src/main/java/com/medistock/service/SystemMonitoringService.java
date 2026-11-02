
package com.medistock.service;

import com.medistock.entity.SystemMonitoring;
import com.medistock.entity.User;
import com.medistock.repository.SystemMonitoringRepository;
import com.medistock.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class SystemMonitoringService {

    private final SystemMonitoringRepository systemMonitoringRepository;
    private final UserRepository userRepository;

    public SystemMonitoringService(
            SystemMonitoringRepository systemMonitoringRepository,
            UserRepository userRepository) {

        this.systemMonitoringRepository = systemMonitoringRepository;
        this.userRepository = userRepository;
    }

    public void record(
            String action,
            String entityType,
            Long entityId,
            String summary) {

        Authentication auth = SecurityContextHolder.getContext()
                .getAuthentication();

        String email = (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal()))
                ? null
                : auth.getName();

        record(action, entityType, entityId, summary, email);
    }

    public void record(
            String action,
            String entityType,
            Long entityId,
            String summary,
            String email) {

        try {
            Long userId = null;

            if (email != null && !email.isBlank()) {
                userId = userRepository.findByEmail(email)
                        .map(User::getUserId)
                        .orElse(null);
            }

            SystemMonitoring log = new SystemMonitoring();

            log.setUserId(userId);
            log.setAction(action);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setSummary(truncate(summary, 255));
            log.setPerformedBy(truncate(email, 150));

            systemMonitoringRepository.save(log);

        } catch (Exception e) {
            // Audit logging must never break the main operation.
            System.err.println(
                    "System monitoring log could not be saved: "
                    + e.getMessage()
            );
        }
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }

        return value.length() <= max
                ? value
                : value.substring(0, max);
    }
}
