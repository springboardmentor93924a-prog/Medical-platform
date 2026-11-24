package com.medistock.medistock.ai.voice.dto;

public record VoiceSpeakRequestDto(
        String text,
        String voice,
        Double speed,
        String format
) {
    public VoiceSpeakRequestDto {
        if (voice == null || voice.isBlank()) {
            voice = "alloy";
        }
        if (speed == null || speed <= 0.0) {
            speed = 1.0;
        }
        if (format == null || format.isBlank()) {
            format = "mp3";
        }
    }

    public static VoiceSpeakRequestDto of(String text) {
        return new VoiceSpeakRequestDto(text, "alloy", 1.0, "mp3");
    }

    public static VoiceSpeakRequestDto of(String text, String voice) {
        return new VoiceSpeakRequestDto(text, voice, 1.0, "mp3");
    }
}

