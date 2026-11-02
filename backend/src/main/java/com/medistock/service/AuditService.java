
package com.medistock.service;

import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final SystemMonitoringService systemMonitoringService;

    public AuditService(
            SystemMonitoringService systemMonitoringService) {
        this.systemMonitoringService = systemMonitoringService;
    }

    public void record(
            String action,
            String entityType,
            Long entityId,
            String summary) {

        systemMonitoringService.record(
                action,
                entityType,
                entityId,
                summary
        );
    }

    public void record(
            String action,
            String entityType,
            Long entityId,
            String summary,
            String email) {

        systemMonitoringService.record(
                action,
                entityType,
                entityId,
                summary,
                email
        );
    }
}
