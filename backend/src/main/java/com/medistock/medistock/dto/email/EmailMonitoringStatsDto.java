package com.medistock.medistock.dto.email;

import java.util.Map;

public class EmailMonitoringStatsDto {
    private long totalOutbox;
    private long sentCount;
    private long pendingCount;
    private long failedCount;
    private long totalLogged;
    private double successRatePercent;
    private boolean smtpConfigured;
    private String smtpHost;
    private int smtpPort;
    private String senderFrom;
    private Map<String, Long> countByEventType;
    private Map<String, Long> countByStatus;

    public EmailMonitoringStatsDto() {}

    public long getTotalOutbox() {
        return totalOutbox;
    }

    public void setTotalOutbox(long totalOutbox) {
        this.totalOutbox = totalOutbox;
    }

    public long getSentCount() {
        return sentCount;
    }

    public void setSentCount(long sentCount) {
        this.sentCount = sentCount;
    }

    public long getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(long pendingCount) {
        this.pendingCount = pendingCount;
    }

    public long getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(long failedCount) {
        this.failedCount = failedCount;
    }

    public long getTotalLogged() {
        return totalLogged;
    }

    public void setTotalLogged(long totalLogged) {
        this.totalLogged = totalLogged;
    }

    public double getSuccessRatePercent() {
        return successRatePercent;
    }

    public void setSuccessRatePercent(double successRatePercent) {
        this.successRatePercent = successRatePercent;
    }

    public boolean isSmtpConfigured() {
        return smtpConfigured;
    }

    public void setSmtpConfigured(boolean smtpConfigured) {
        this.smtpConfigured = smtpConfigured;
    }

    public String getSmtpHost() {
        return smtpHost;
    }

    public void setSmtpHost(String smtpHost) {
        this.smtpHost = smtpHost;
    }

    public int getSmtpPort() {
        return smtpPort;
    }

    public void setSmtpPort(int smtpPort) {
        this.smtpPort = smtpPort;
    }

    public String getSenderFrom() {
        return senderFrom;
    }

    public void setSenderFrom(String senderFrom) {
        this.senderFrom = senderFrom;
    }

    public Map<String, Long> getCountByEventType() {
        return countByEventType;
    }

    public void setCountByEventType(Map<String, Long> countByEventType) {
        this.countByEventType = countByEventType;
    }

    public Map<String, Long> getCountByStatus() {
        return countByStatus;
    }

    public void setCountByStatus(Map<String, Long> countByStatus) {
        this.countByStatus = countByStatus;
    }
}

