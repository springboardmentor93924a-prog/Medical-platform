package com.medistock.medistock.service;

import com.medistock.medistock.dto.audit.AuditIntegrityReportDto;
import com.medistock.medistock.entity.AuditLog;
import com.medistock.medistock.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

@Service
public class AuditIntegrityService {

    public static final String GENESIS_HASH = "GENESIS_ROOT_HASH_0000000000000000000000000000000000000000000000000000000000000000";

    private final AuditLogRepository auditLogRepository;

    public AuditIntegrityService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Compute SHA-256 hash for an audit log record tied to its predecessor.
     */
    public String calculateHash(String previousHash, String eventId, Integer userId, String roleName,
                                String action, String moduleName, String status,
                                String oldValues, String newValues, String timestampStr) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = String.format("%s:%s:%s:%s:%s:%s:%s:%s:%s:%s",
                    previousHash != null ? previousHash : GENESIS_HASH,
                    eventId != null ? eventId : "",
                    userId != null ? userId : 0,
                    roleName != null ? roleName : "",
                    action != null ? action : "",
                    moduleName != null ? moduleName : "",
                    status != null ? status : "SUCCESS",
                    oldValues != null ? oldValues : "",
                    newValues != null ? newValues : "",
                    timestampStr != null ? timestampStr : "");

            byte[] encodedhash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }

    /**
     * Retrieves previous hash for the next record in the tamper-evident chain.
     */
    public String getNextPreviousHash() {
        Optional<AuditLog> latest = auditLogRepository.findTopByOrderByAuditLogIdDesc();
        if (latest.isPresent() && latest.get().getCurrentHash() != null) {
            return latest.get().getCurrentHash();
        }
        return GENESIS_HASH;
    }

    /**
     * Verifies the entire cryptographic hash chain across all stored audit records.
     * Detects unauthorized modifications, deleted records, or broken links.
     */
    public AuditIntegrityReportDto verifyLedgerIntegrity() {
        AuditIntegrityReportDto report = new AuditIntegrityReportDto();
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByAuditLogIdAsc();

        report.setTotalRecordsVerified(allLogs.size());
        report.setGenesisHash(GENESIS_HASH);

        if (allLogs.isEmpty()) {
            report.setChainValid(true);
            report.setStatus("EMPTY");
            report.setLatestHash(GENESIS_HASH);
            return report;
        }

        String expectedPreviousHash = GENESIS_HASH;
        boolean allValid = true;

        for (int i = 0; i < allLogs.size(); i++) {
            AuditLog log = allLogs.get(i);

            // Legacy entries prior to hash chaining implementation get back-propagated
            if (log.getCurrentHash() == null) {
                String legacyTs = log.getCreatedAt() != null ? log.getCreatedAt().toString() : "2026-01-01";
                String computedHash = calculateHash(
                        expectedPreviousHash,
                        log.getEventId() != null ? log.getEventId() : "EVT-LEGACY-" + log.getAuditLogId(),
                        log.getUserId(),
                        log.getRoleName(),
                        log.getAction() != null ? log.getAction() : log.getActionType(),
                        log.getModuleName() != null ? log.getModuleName() : "LEGACY",
                        log.getStatus(),
                        log.getOldValues(),
                        log.getNewValues(),
                        legacyTs
                );
                log.setPreviousHash(expectedPreviousHash);
                log.setCurrentHash(computedHash);
                auditLogRepository.save(log);
            }

            // Verify previous_hash link
            if (!expectedPreviousHash.equals(log.getPreviousHash())) {
                allValid = false;
                report.getDiscrepancies().add(String.format(
                        "Broken chain pointer at ID #%d (Event: %s). Expected previous hash '%s' but found '%s'",
                        log.getAuditLogId(), log.getEventId(), expectedPreviousHash, log.getPreviousHash()
                ));
            }

            // Verify current_hash calculation
            String ts = log.getCreatedAt() != null ? log.getCreatedAt().withNano(0).toString() : "";
            String recalculatedHash = calculateHash(
                    log.getPreviousHash(),
                    log.getEventId(),
                    log.getUserId(),
                    log.getRoleName(),
                    log.getAction(),
                    log.getModuleName(),
                    log.getStatus(),
                    log.getOldValues(),
                    log.getNewValues(),
                    ts
            );

            if (log.getCurrentHash() != null && !log.getCurrentHash().equalsIgnoreCase(recalculatedHash)) {
                allValid = false;
                report.getDiscrepancies().add(String.format(
                        "Tamper detected in record #%d (Event: %s). Stored hash '%s' does not match computed signature '%s'",
                        log.getAuditLogId(), log.getEventId(), log.getCurrentHash(), recalculatedHash
                ));
            }

            expectedPreviousHash = log.getCurrentHash();
        }

        report.setChainValid(allValid);
        report.setLatestHash(expectedPreviousHash);
        report.setStatus(allValid ? "SECURE" : "TAMPER_DETECTED");
        return report;
    }

    /**
     * Initializes or repairs the immutable hash chain across all records in the ledger.
     */
    @Transactional
    public AuditIntegrityReportDto repairOrInitializeLedger() {
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByAuditLogIdAsc();
        String expectedPreviousHash = GENESIS_HASH;

        for (AuditLog log : allLogs) {
            if (log.getEventId() == null || log.getEventId().isBlank()) {
                log.setEventId(String.format("AUD-LEGACY-%06d", log.getAuditLogId()));
            }
            if (log.getAction() == null || log.getAction().isBlank()) {
                log.setAction(log.getActionType() != null ? log.getActionType() : "SYSTEM_EVENT");
            }
            if (log.getModuleName() == null || log.getModuleName().isBlank()) {
                log.setModuleName("SYSTEM");
            }
            if (log.getRoleName() == null || log.getRoleName().isBlank()) {
                log.setRoleName("ADMIN");
            }
            if (log.getStatus() == null || log.getStatus().isBlank()) {
                log.setStatus("SUCCESS");
            }
            if (log.getCreatedAt() == null) {
                log.setCreatedAt(java.time.LocalDateTime.of(2026, 1, 1, 0, 0, 0));
            } else {
                log.setCreatedAt(log.getCreatedAt().withNano(0));
            }

            String ts = log.getCreatedAt().toString();
            String computedHash = calculateHash(
                    expectedPreviousHash,
                    log.getEventId(),
                    log.getUserId(),
                    log.getRoleName(),
                    log.getAction(),
                    log.getModuleName(),
                    log.getStatus(),
                    log.getOldValues(),
                    log.getNewValues(),
                    ts
            );

            log.setPreviousHash(expectedPreviousHash);
            log.setCurrentHash(computedHash);
            expectedPreviousHash = computedHash;
            auditLogRepository.save(log);
        }

        return verifyLedgerIntegrity();
    }

    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
