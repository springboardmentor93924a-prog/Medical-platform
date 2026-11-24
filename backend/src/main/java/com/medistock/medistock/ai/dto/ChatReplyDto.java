package com.medistock.medistock.ai.dto;

import java.time.LocalDateTime;

public class ChatReplyDto {
    private Integer sessionId;
    private String reply;
    private String provider;
    private String toolUsed;
    private Object toolData;
    private LocalDateTime timestamp;
    private ChatProvenanceDto provenance;

    public ChatReplyDto() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatReplyDto(Integer sessionId, String reply, String provider, String toolUsed, Object toolData) {
        this(sessionId, reply, provider, toolUsed, toolData, null);
    }

    public ChatReplyDto(Integer sessionId, String reply, String provider, String toolUsed, Object toolData, ChatProvenanceDto provenance) {
        this.sessionId = sessionId;
        this.reply = reply;
        this.provider = provider;
        this.toolUsed = toolUsed;
        this.toolData = toolData;
        this.provenance = provenance;
        this.timestamp = LocalDateTime.now();
    }

    public Integer getSessionId() {
        return sessionId;
    }

    public void setSessionId(Integer sessionId) {
        this.sessionId = sessionId;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getToolUsed() {
        return toolUsed;
    }

    public void setToolUsed(String toolUsed) {
        this.toolUsed = toolUsed;
    }

    public Object getToolData() {
        return toolData;
    }

    public void setToolData(Object toolData) {
        this.toolData = toolData;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public ChatProvenanceDto getProvenance() {
        return provenance;
    }

    public void setProvenance(ChatProvenanceDto provenance) {
        this.provenance = provenance;
    }
}

