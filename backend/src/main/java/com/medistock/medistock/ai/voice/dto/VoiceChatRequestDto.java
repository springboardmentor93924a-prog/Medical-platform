package com.medistock.medistock.ai.voice.dto;

public record VoiceChatRequestDto(
        Integer sessionId,
        String message,
        String language,
        Boolean autoSpeak
) {
    public VoiceChatRequestDto {
        if (autoSpeak == null) {
            autoSpeak = false;
        }
    }
}

