package com.medistock.backend.dto;

import java.time.Instant;
import java.util.List;

public final class MonitoringDtos {
    private MonitoringDtos() {}

    /** status: UP, DOWN or OFF (switched off or not configured) */
    public record Check(String name, String status, String detail) {}
    public record ServerInfo(Instant startedAt, long uptimeSeconds, String javaVersion,
                             long memoryUsedMb, long memoryMaxMb, int processors) {}
    public record Counts(long users, long activeUsers, long inactiveUsers, long lockedAccounts,
                         long medicines, long batches, long openOrders, long awaitingApproval) {}
    public record Activity(String text, String by, Instant time) {}
    public record Signup(String username, String role, Instant time) {}
    public record ErrorItem(Instant time, String method, String path, String type, String message) {}

    public record MonitoringResponse(Instant checkedAt, List<Check> checks, ServerInfo server, Counts counts,
                                     List<Activity> activity, List<Signup> signups, List<ErrorItem> errors) {}
}
