package com.medistock.medistock.ai.dto;

import java.util.Map;

public class ChatMessageDto {
    private String role; // "user", "assistant", "system", "tool"
    private String content;
    private String toolName;
    private Map<String, Object> toolArguments;
    private Object toolResult;

    public ChatMessageDto() {
    }

    public ChatMessageDto(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public static ChatMessageDto user(String content) {
        return new ChatMessageDto("user", content);
    }

    public static ChatMessageDto assistant(String content) {
        return new ChatMessageDto("assistant", content);
    }

    public static ChatMessageDto system(String content) {
        return new ChatMessageDto("system", content);
    }

    public static ChatMessageDto tool(String toolName, Object toolResult) {
        String contentStr = null;
        if (toolResult != null) {
            try {
                contentStr = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(toolResult);
            } catch (Exception e) {
                contentStr = String.valueOf(toolResult);
            }
        }
        ChatMessageDto dto = new ChatMessageDto("tool", contentStr);
        dto.setToolName(toolName);
        dto.setToolResult(toolResult);
        return dto;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getToolName() {
        return toolName;
    }

    public void setToolName(String toolName) {
        this.toolName = toolName;
    }

    public Map<String, Object> getToolArguments() {
        return toolArguments;
    }

    public void setToolArguments(Map<String, Object> toolArguments) {
        this.toolArguments = toolArguments;
    }

    public Object getToolResult() {
        return toolResult;
    }

    public void setToolResult(Object toolResult) {
        this.toolResult = toolResult;
    }
}

