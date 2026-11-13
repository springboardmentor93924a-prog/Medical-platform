package com.medistock.backend.dto;

import java.time.Instant;
import java.util.List;

public final class AuditDtos {
    private AuditDtos() {}

    /** category: Orders, Stock or Counts */
    public record AuditEvent(Instant time, String actor, String role, String action, String target, String detail, String category) {}

    /** What one user has done: orders placed, how much they ordered, approvals, and stock receipts */
    public record AuditSummary(String username, String role, long ordersPlaced, long orderValue,
                               long approved, long rejected, long receipts) {}

    public record AuditResponse(List<AuditSummary> summary, List<AuditEvent> events) {}
}
