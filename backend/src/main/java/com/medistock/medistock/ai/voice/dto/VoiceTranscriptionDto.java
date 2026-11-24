package com.medistock.medistock.ai.voice.dto;

public record VoiceTranscriptionDto(
        String text,
        String language,
        Double confidence,
        Double durationSeconds,
        String provider
) {
    public static VoiceTranscriptionDto of(String text, String language, Double confidence, Double durationSeconds, String provider) {
        return new VoiceTranscriptionDto(text, language, confidence, durationSeconds, provider);
    }

    public static VoiceTranscriptionDto simple(String text, String provider) {
        return new VoiceTranscriptionDto(text, "en", 1.0, 0.0, provider);
    }
}

