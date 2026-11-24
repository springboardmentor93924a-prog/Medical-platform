package com.medistock.medistock.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medistock.medistock.dto.audit.*;
import com.medistock.medistock.entity.AuditLog;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.AuditLogRepository;
import com.medistock.medistock.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final AuditIntegrityService auditIntegrityService;
    private final AuditAlertService auditAlertService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final Set<String> SENSITIVE_FIELDS = Set.of(
            "password", "passwordhash", "secret", "token", "accesstoken", "refreshtoken", "apikey", "credential"
    );

    public AuditService(AuditLogRepository auditLogRepository,
                        AuditIntegrityService auditIntegrityService,
                        AuditAlertService auditAlertService,
                        UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.auditIntegrityService = auditIntegrityService;
        this.auditAlertService = auditAlertService;
        this.userRepository = userRepository;
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        this.objectMapper = mapper;
    }

    /**
     * Advanced server-side audit logging with before-and-after diffing and SHA-256 hash chaining.
     */
    @Transactional
    public AuditLog logEvent(Integer userId, String roleName, String action, String moduleName,
                             String entityType, Integer entityId,
                             Object oldState, Object newState,
                             String reason, String status,
                             HttpServletRequest request) {
        try {
            AuditLog log = new AuditLog();
            String eventId = "AUD-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();
            log.setEventId(eventId);
            log.setUserId(userId);
            log.setRoleName(roleName != null ? roleName : "SYSTEM");
            log.setAction(action);
            log.setActionType(action);
            log.setModuleName(moduleName);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setReason(reason);
            log.setActionDescription(reason != null ? reason : action);
            log.setStatus(status != null ? status : "SUCCESS");

            // Extract network info
            String ip = "127.0.0.1";
            String userAgent = "Internal";
            String reqId = "REQ-" + UUID.randomUUID().toString().substring(0, 8);

            if (request != null) {
                String xff = request.getHeader("X-Forwarded-For");
                ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : request.getRemoteAddr();
                String ua = request.getHeader("User-Agent");
                if (ua != null) userAgent = ua.length() > 490 ? ua.substring(0, 490) : ua;
                String rId = request.getHeader("X-Request-ID");
                if (rId != null && !rId.isBlank()) reqId = rId;
            }

            log.setIpAddress(ip);
            log.setUserAgent(userAgent);
            log.setRequestId(reqId);

            // Compute Before-and-After JSON diffs
            String oldJson = buildMaskedJson(oldState);
            String newJson = buildMaskedJson(newState);
            log.setOldValues(oldJson);
            log.setNewValues(newJson);

            // Cryptographic SHA-256 Hash Chaining
            String prevHash = auditIntegrityService.getNextPreviousHash();
            log.setPreviousHash(prevHash);

            java.time.LocalDateTime now = java.time.LocalDateTime.now().withNano(0);
            log.setCreatedAt(now);
            String timestampStr = now.toString();
            String currentHash = auditIntegrityService.calculateHash(
                    prevHash, eventId, userId, roleName, action, moduleName,
                    log.getStatus(), oldJson, newJson, timestampStr
            );
            log.setCurrentHash(currentHash);

            AuditLog saved = auditLogRepository.save(log);

            // Anomaly inspection
            if ("LOGIN_FAILED".equalsIgnoreCase(action)) {
                auditAlertService.checkForBruteForceLogin(reason, ip);
            } else if ("BLOCKED".equalsIgnoreCase(status) || "UNAUTHORIZED".equalsIgnoreCase(status)) {
                auditAlertService.recordUnauthorizedAccessAlert(userId, null, roleName, reason, ip);
            }

            return saved;
        } catch (Exception ex) {
            System.err.println("[AuditService] Failed to record immutable audit log: " + ex.getMessage());
            return null;
        }
    }

    /**
     * Backward-compatible helper method used throughout existing codebase.
     */
    public void logAction(Integer userId, String actionType, String entityType, Integer entityId, String description, HttpServletRequest request) {
        String role = "USER";
        if (userId != null) {
            Optional<User> u = userRepository.findById(userId);
            if (u.isPresent() && u.get().getRole() != null) {
                role = u.get().getRole().getRoleName();
            }
        }
        String module = entityType != null ? entityType.toUpperCase() : "GENERAL";
        logEvent(userId, role, actionType, module, entityType, entityId, null, null, description, "SUCCESS", request);
    }

    /**
     * Paginated and multi-criteria audit log query for Admin Dashboard.
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(AuditFilterRequest filter, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "auditLogId"));

        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String term = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("action")), term),
                        cb.like(cb.lower(root.get("moduleName")), term),
                        cb.like(cb.lower(root.get("eventId")), term),
                        cb.like(cb.lower(root.get("reason")), term),
                        cb.like(cb.lower(root.get("ipAddress")), term)
                );
                predicates.add(searchPredicate);
            }

            if (filter.getRole() != null && !filter.getRole().equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.upper(root.get("roleName")), filter.getRole().toUpperCase()));
            }

            if (filter.getModule() != null && !filter.getModule().equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.upper(root.get("moduleName")), filter.getModule().toUpperCase()));
            }

            if (filter.getAction() != null && !filter.getAction().equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.upper(root.get("action")), filter.getAction().toUpperCase()));
            }

            if (filter.getStatus() != null && !filter.getStatus().equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(cb.upper(root.get("status")), filter.getStatus().toUpperCase()));
            }

            if (filter.getUserId() != null) {
                predicates.add(cb.equal(root.get("userId"), filter.getUserId()));
            }

            if (filter.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getStartDate()));
            }

            if (filter.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> pageResult = auditLogRepository.findAll(spec, pageable);
        return pageResult.map(this::mapToDto);
    }

    /**
     * Timeline for a specific user.
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getUserActivityTimeline(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "auditLogId"));
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::mapToDto);
    }

    /**
     * Get single audit record by event ID.
     */
    @Transactional(readOnly = true)
    public Optional<AuditLogDto> getAuditLogByEventId(String eventId) {
        return auditLogRepository.findByEventId(eventId).map(this::mapToDto);
    }

    /**
     * Summary KPI metrics for Admin Dashboard.
     */
    @Transactional(readOnly = true)
    public AuditSummaryDto getAuditSummary() {
        AuditSummaryDto summary = new AuditSummaryDto();
        summary.setTotalActivities(auditLogRepository.count());
        summary.setActiveUsers(auditLogRepository.countDistinctActiveUsers());
        summary.setSecurityAlerts(auditAlertService.getActiveAlertsCount());
        summary.setFailedActions(auditLogRepository.countByStatus("FAILED"));
        summary.setSuccessActions(auditLogRepository.countByStatus("SUCCESS"));
        summary.setBlockedActions(auditLogRepository.countByStatus("BLOCKED"));

        AuditIntegrityReportDto integrity = auditIntegrityService.verifyLedgerIntegrity();
        summary.setLedgerIntegrityValid(integrity.isChainValid());
        summary.setLastVerifiedHash(integrity.getLatestHash());

        return summary;
    }

    private AuditLogDto mapToDto(AuditLog log) {
        AuditLogDto dto = new AuditLogDto();
        dto.setId(log.getAuditLogId());
        dto.setEventId(log.getEventId() != null ? log.getEventId() : "AUD-" + log.getAuditLogId());
        dto.setUserId(log.getUserId());
        dto.setRoleName(log.getRoleName() != null ? log.getRoleName() : (log.getUser() != null && log.getUser().getRole() != null ? log.getUser().getRole().getRoleName() : "USER"));
        dto.setUserName(log.getUser() != null ? log.getUser().getFullName() : "User " + log.getUserId());
        dto.setUserEmail(log.getUser() != null ? log.getUser().getEmail() : null);
        dto.setAction(log.getAction() != null ? log.getAction() : log.getActionType());
        dto.setModuleName(log.getModuleName() != null ? log.getModuleName() : (log.getEntityType() != null ? log.getEntityType().toUpperCase() : "GENERAL"));
        dto.setEntityType(log.getEntityType());
        dto.setEntityId(log.getEntityId());
        dto.setOldValues(log.getOldValues());
        dto.setNewValues(log.getNewValues());
        dto.setReason(log.getReason() != null ? log.getReason() : log.getActionDescription());
        dto.setStatus(log.getStatus() != null ? log.getStatus() : "SUCCESS");
        dto.setIpAddress(log.getIpAddress());
        dto.setUserAgent(log.getUserAgent());
        dto.setRequestId(log.getRequestId());
        dto.setPreviousHash(log.getPreviousHash());
        dto.setCurrentHash(log.getCurrentHash());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }

    private String buildMaskedJson(Object obj) {
        if (obj == null) return null;
        try {
            if (obj instanceof String str) {
                return str;
            }
            ObjectNode node = objectMapper.valueToTree(obj);
            maskSensitiveNode(node);
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    private void maskSensitiveNode(ObjectNode node) {
        Iterator<String> fieldNames = node.fieldNames();
        List<String> toMask = new ArrayList<>();
        while (fieldNames.hasNext()) {
            String field = fieldNames.next();
            if (SENSITIVE_FIELDS.contains(field.toLowerCase())) {
                toMask.add(field);
            }
        }
        for (String field : toMask) {
            node.put(field, "******** [MASKED]");
        }
    }
}
