package com.medistock.medistock.ai.tools;

import com.medistock.medistock.entity.AuditLog;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.AuditLogRepository;
import com.medistock.medistock.repository.UserRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class UserActivityTool {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public UserActivityTool(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves system audit trail and user activity records.
     * Roles: ADMIN ONLY.
     * Pharmacist, Staff, Supplier: Blocked.
     */
    public List<Map<String, Object>> getUserActivity(Integer targetUserId, String actionType, Integer limit) {
        String role = currentUserService != null ? currentUserService.getCurrentUserRole() : "ADMIN";

        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new SecurityException("Access Denied: Only system Administrators are authorized to view user activity and audit logs.");
        }

        int max = (limit != null && limit > 0 && limit <= 50) ? limit : 25;
        List<AuditLog> logs = auditLogRepository.findTop25ByOrderByCreatedAtDesc();

        if (targetUserId != null) {
            logs = logs.stream()
                    .filter(l -> targetUserId.equals(l.getUserId()))
                    .toList();
        }

        if (actionType != null && !actionType.isBlank()) {
            logs = logs.stream()
                    .filter(l -> l.getActionType() != null && l.getActionType().equalsIgnoreCase(actionType.trim()))
                    .toList();
        }

        Map<Integer, String> userNameCache = new HashMap<>();
        List<Map<String, Object>> results = new ArrayList<>();

        for (AuditLog l : logs.stream().limit(max).toList()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("auditLogId", l.getAuditLogId());
            map.put("userId", l.getUserId());
            map.put("actionType", l.getActionType());
            map.put("entityType", l.getEntityType());
            map.put("entityId", l.getEntityId());
            map.put("actionDescription", l.getActionDescription());
            map.put("ipAddress", l.getIpAddress());
            map.put("createdAt", l.getCreatedAt());

            if (l.getUserId() != null) {
                String userName = userNameCache.computeIfAbsent(l.getUserId(), id -> {
                    User u = userRepository.findById(id).orElse(null);
                    return u != null ? u.getFullName() : "User #" + id;
                });
                map.put("userName", userName);
            }

            results.add(map);
        }

        return results;
    }
}

