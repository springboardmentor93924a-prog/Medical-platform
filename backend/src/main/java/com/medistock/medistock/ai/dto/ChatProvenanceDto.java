package com.medistock.medistock.ai.dto;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public class ChatProvenanceDto {
    private boolean verified;
    private String groundingSource;
    private List<String> toolsInvoked;
    private int recordsReferenced;
    private LocalDateTime executionTimestamp;

    public ChatProvenanceDto() {
        this.executionTimestamp = LocalDateTime.now();
        this.toolsInvoked = Collections.emptyList();
    }

    public ChatProvenanceDto(boolean verified, String groundingSource, List<String> toolsInvoked, int recordsReferenced) {
        this.verified = verified;
        this.groundingSource = groundingSource;
        this.toolsInvoked = toolsInvoked != null ? toolsInvoked : Collections.emptyList();
        this.recordsReferenced = recordsReferenced;
        this.executionTimestamp = LocalDateTime.now();
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getGroundingSource() {
        return groundingSource;
    }

    public void setGroundingSource(String groundingSource) {
        this.groundingSource = groundingSource;
    }

    public List<String> getToolsInvoked() {
        return toolsInvoked;
    }

    public void setToolsInvoked(List<String> toolsInvoked) {
        this.toolsInvoked = toolsInvoked;
    }

    public int getRecordsReferenced() {
        return recordsReferenced;
    }

    public void setRecordsReferenced(int recordsReferenced) {
        this.recordsReferenced = recordsReferenced;
    }

    public LocalDateTime getExecutionTimestamp() {
        return executionTimestamp;
    }

    public void setExecutionTimestamp(LocalDateTime executionTimestamp) {
        this.executionTimestamp = executionTimestamp;
    }
}

