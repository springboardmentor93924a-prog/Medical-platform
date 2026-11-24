package com.medistock.medistock.ai.voice.dto;

import java.time.LocalDateTime;

public record VoiceSessionDto(
        String sessionId,
        Integer userId,
        String status,
        String mode,
        LocalDateTime createdAt
) {
    public static VoiceSessionDto active(String sessionId, Integer userId, String mode) {
        return new VoiceSessionDto(sessionId, userId, "ACTIVE", mode, LocalDateTime.now());
    }
}

