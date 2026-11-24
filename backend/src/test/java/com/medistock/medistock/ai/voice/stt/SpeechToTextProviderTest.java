package com.medistock.medistock.ai.voice.stt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medistock.medistock.ai.voice.dto.VoiceTranscriptionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SpeechToTextProviderTest {

    private HttpClient mockHttpClient;
    private HttpResponse<String> mockStringResponse;
    private ObjectMapper objectMapper;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mockHttpClient = mock(HttpClient.class);
        mockStringResponse = mock(HttpResponse.class);
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Cloud STT returns provider name and checks availability correctly")
    void testCloudProviderAvailability() {
        CloudSpeechToTextProvider availableProvider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "sk-valid-openai-key-12345", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );
        assertEquals("OPENAI_WHISPER", availableProvider.getProviderName());
        assertTrue(availableProvider.isAvailable());

        CloudSpeechToTextProvider noKeyProvider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );
        assertFalse(noKeyProvider.isAvailable());

        CloudSpeechToTextProvider demoKeyProvider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "demo-key", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );
        assertFalse(demoKeyProvider.isAvailable());
    }

    @Test
    @DisplayName("Cloud STT throws IllegalStateException when unconfigured")
    void testCloudProviderThrowsWhenUnconfigured() {
        CloudSpeechToTextProvider provider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );
        byte[] dummyAudio = new byte[]{1, 2, 3};

        assertThrows(IllegalStateException.class, () ->
                provider.transcribe(dummyAudio, "test.webm", "audio/webm", "en")
        );
    }

    @Test
    @DisplayName("Cloud STT throws IllegalArgumentException on null or empty audio bytes")
    void testCloudProviderThrowsOnEmptyAudio() {
        CloudSpeechToTextProvider provider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );

        assertThrows(IllegalArgumentException.class, () ->
                provider.transcribe(null, "test.webm", "audio/webm", "en")
        );
        assertThrows(IllegalArgumentException.class, () ->
                provider.transcribe(new byte[0], "test.webm", "audio/webm", "en")
        );
    }

    @Test
    @DisplayName("Cloud STT successfully parses OpenAI Whisper multipart response")
    void testCloudProviderSuccessfulTranscription() throws Exception {
        CloudSpeechToTextProvider provider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );

        String jsonResponse = "{\"text\":\"Show me medicines expiring in 30 days.\",\"language\":\"en\",\"duration\":3.42}";
        when(mockStringResponse.statusCode()).thenReturn(200);
        when(mockStringResponse.body()).thenReturn(jsonResponse);
        when(mockHttpClient.send(any(HttpRequest.class), eq(HttpResponse.BodyHandlers.ofString()))).thenReturn(mockStringResponse);

        byte[] audioBytes = "fake-audio-payload".getBytes();
        VoiceTranscriptionDto result = provider.transcribe(audioBytes, "voice.webm", "audio/webm", "en");

        assertNotNull(result);
        assertEquals("Show me medicines expiring in 30 days.", result.text());
        assertEquals("en", result.language());
        assertEquals(3.42, result.durationSeconds());
        assertEquals("OPENAI_WHISPER", result.provider());
    }

    @Test
    @DisplayName("Cloud STT throws RuntimeException on upstream HTTP error")
    void testCloudProviderHandlesHttpError() throws Exception {
        CloudSpeechToTextProvider provider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );

        when(mockStringResponse.statusCode()).thenReturn(401);
        when(mockStringResponse.body()).thenReturn("{\"error\":{\"message\":\"Incorrect API key provided\"}}");
        when(mockHttpClient.send(any(HttpRequest.class), eq(HttpResponse.BodyHandlers.ofString()))).thenReturn(mockStringResponse);

        byte[] audioBytes = "fake-audio-payload".getBytes();
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                provider.transcribe(audioBytes, "voice.webm", "audio/webm", "en")
        );
        assertTrue(ex.getMessage().contains("Whisper STT request failed with status 401"));
    }

    @Test
    @DisplayName("Cloud STT handles network timeout or IO exception gracefully")
    void testCloudProviderHandlesNetworkFailure() throws Exception {
        CloudSpeechToTextProvider provider = new CloudSpeechToTextProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/transcriptions", "whisper-1"
        );

        when(mockHttpClient.send(any(HttpRequest.class), eq(HttpResponse.BodyHandlers.ofString())))
                .thenThrow(new IOException("Connection timed out"));

        byte[] audioBytes = "fake-audio-payload".getBytes();
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                provider.transcribe(audioBytes, "voice.webm", "audio/webm", "en")
        );
        assertTrue(ex.getMessage().contains("Cloud speech transcription failed"));
    }

    @Test
    @DisplayName("Local STT returns LOCAL_WHISPER name and handles disabled state")
    void testLocalProviderDisabledState() {
        LocalSpeechToTextProvider localProvider = new LocalSpeechToTextProvider(
                mockHttpClient, objectMapper, "http://localhost:8000/v1/audio/transcriptions", false
        );

        assertEquals("LOCAL_WHISPER", localProvider.getProviderName());
        assertFalse(localProvider.isAvailable());

        byte[] dummyAudio = new byte[]{1, 2, 3};
        assertThrows(IllegalStateException.class, () ->
                localProvider.transcribe(dummyAudio, "test.webm", "audio/webm", "en")
        );
    }
}
