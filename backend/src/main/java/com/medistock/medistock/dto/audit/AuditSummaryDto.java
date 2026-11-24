package com.medistock.medistock.dto.audit;

public class AuditSummaryDto {
    private long totalActivities;
    private long activeUsers;
    private long securityAlerts;
    private long failedActions;
    private long successActions;
    private long blockedActions;
    private boolean ledgerIntegrityValid;
    private String lastVerifiedHash;

    public AuditSummaryDto() {}

    public long getTotalActivities() { return totalActivities; }
    public void setTotalActivities(long totalActivities) { this.totalActivities = totalActivities; }

    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

    public long getSecurityAlerts() { return securityAlerts; }
    public void setSecurityAlerts(long securityAlerts) { this.securityAlerts = securityAlerts; }

    public long getFailedActions() { return failedActions; }
    public void setFailedActions(long failedActions) { this.failedActions = failedActions; }

    public long getSuccessActions() { return successActions; }
    public void setSuccessActions(long successActions) { this.successActions = successActions; }

    public long getBlockedActions() { return blockedActions; }
    public void setBlockedActions(long blockedActions) { this.blockedActions = blockedActions; }

    public boolean isLedgerIntegrityValid() { return ledgerIntegrityValid; }
    public void setLedgerIntegrityValid(boolean ledgerIntegrityValid) { this.ledgerIntegrityValid = ledgerIntegrityValid; }

    public String getLastVerifiedHash() { return lastVerifiedHash; }
    public void setLastVerifiedHash(String lastVerifiedHash) { this.lastVerifiedHash = lastVerifiedHash; }
}
