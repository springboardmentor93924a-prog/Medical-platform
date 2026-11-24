package com.medistock.medistock.ai.voice.stt;

import com.medistock.medistock.ai.voice.dto.VoiceTranscriptionDto;

public interface SpeechToTextProvider {

    /**
     * Unique identifier for the STT provider (e.g. "OPENAI_WHISPER", "LOCAL_WHISPER").
     */
    String getProviderName();

    /**
     * Indicates whether the provider is currently configured and operational.
     */
    boolean isAvailable();

    /**
     * Transcribes raw audio bytes into formatted text.
     *
     * @param audioBytes the binary audio file content
     * @param filename   the uploaded filename (e.g. "recording.webm", "sample.wav")
     * @param mimeType   audio mime-type (e.g. "audio/webm", "audio/wav")
     * @param language   optional ISO 639-1 language code (e.g. "en", "ta", "hi")
     * @return structured transcription result
     */
    VoiceTranscriptionDto transcribe(byte[] audioBytes, String filename, String mimeType, String language);
}

