package com.medistock.medistock.ai.voice.tts;

public interface TextToSpeechProvider {

    /**
     * Unique identifier for the TTS provider (e.g. "OPENAI_TTS", "LOCAL_TTS").
     */
    String getProviderName();

    /**
     * Indicates whether the provider is currently configured and operational.
     */
    boolean isAvailable();

    /**
     * Synthesizes plain text into binary MP3 audio bytes.
     *
     * @param text  the message text to speak
     * @param voice the preferred assistant voice (e.g. "alloy", "nova")
     * @param speed playback speed factor (e.g. 1.0)
     * @return raw audio byte array formatted as MP3
     */
    byte[] synthesizeSpeech(String text, String voice, Double speed);
}

