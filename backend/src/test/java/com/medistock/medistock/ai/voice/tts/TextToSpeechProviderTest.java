package com.medistock.medistock.ai.voice.tts;

import com.fasterxml.jackson.databind.ObjectMapper;
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

class TextToSpeechProviderTest {

    private HttpClient mockHttpClient;
    private HttpResponse<byte[]> mockByteResponse;
    private ObjectMapper objectMapper;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mockHttpClient = mock(HttpClient.class);
        mockByteResponse = mock(HttpResponse.class);
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Cloud TTS checks provider name and availability based on API key")
    void testCloudProviderAvailability() {
        CloudTextToSpeechProvider availableProvider = new CloudTextToSpeechProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/speech", "tts-1"
        );
        assertEquals("OPENAI_TTS", availableProvider.getProviderName());
        assertTrue(availableProvider.isAvailable());

        CloudTextToSpeechProvider emptyKeyProvider = new CloudTextToSpeechProvider(
                mockHttpClient, objectMapper, "", "https://api.openai.com/v1/audio/speech", "tts-1"
        );
        assertFalse(emptyKeyProvider.isAvailable());
    }

    @Test
    @DisplayName("Cloud TTS throws IllegalStateException when unconfigured")
    void testCloudProviderThrowsWhenUnconfigured() {
        CloudTextToSpeechProvider provider = new CloudTextToSpeechProvider(
                mockHttpClient, objectMapper, "", "https://api.openai.com/v1/audio/speech", "tts-1"
        );

        assertThrows(IllegalStateException.class, () ->
                provider.synthesizeSpeech("Stock is low", "alloy", 1.0)
        );
    }

    @Test
    @DisplayName("Cloud TTS throws IllegalArgumentException on null or blank text")
    void testCloudProviderThrowsOnEmptyText() {
        CloudTextToSpeechProvider provider = new CloudTextToSpeechProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/speech", "tts-1"
        );

        assertThrows(IllegalArgumentException.class, () ->
                provider.synthesizeSpeech(null, "alloy", 1.0)
        );
        assertThrows(IllegalArgumentException.class, () ->
                provider.synthesizeSpeech("   ", "alloy", 1.0)
        );
    }

    @Test
    @DisplayName("Cloud TTS returns MP3 audio bytes on HTTP 200 response")
    void testCloudProviderSuccessfulSynthesis() throws Exception {
        CloudTextToSpeechProvider provider = new CloudTextToSpeechProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/speech", "tts-1"
        );

        byte[] fakeMp3Bytes = new byte[]{-1, -14, 0, 10, 20, 30};
        when(mockByteResponse.statusCode()).thenReturn(200);
        when(mockByteResponse.body()).thenReturn(fakeMp3Bytes);
        when(mockHttpClient.send(any(HttpRequest.class), eq(HttpResponse.BodyHandlers.ofByteArray())))
                .thenReturn(mockByteResponse);

        byte[] result = provider.synthesizeSpeech("12 batches expire within thirty days.", "nova", 1.25);

        assertNotNull(result);
        assertEquals(fakeMp3Bytes.length, result.length);
        assertArrayEquals(fakeMp3Bytes, result);
    }

    @Test
    @DisplayName("Cloud TTS throws RuntimeException when API returns 500 error")
    void testCloudProviderHandlesHttpError() throws Exception {
        CloudTextToSpeechProvider provider = new CloudTextToSpeechProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/speech", "tts-1"
        );

        when(mockByteResponse.statusCode()).thenReturn(500);
        when(mockByteResponse.body()).thenReturn("Internal Server Error".getBytes());
        when(mockHttpClient.send(any(HttpRequest.class), eq(HttpResponse.BodyHandlers.ofByteArray())))
                .thenReturn(mockByteResponse);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                provider.synthesizeSpeech("Test text", "alloy", 1.0)
        );
        assertTrue(ex.getMessage().contains("Cloud TTS API returned error HTTP 500"));
    }

    @Test
    @DisplayName("Cloud TTS throws RuntimeException on network IO exception")
    void testCloudProviderHandlesNetworkFailure() throws Exception {
        CloudTextToSpeechProvider provider = new CloudTextToSpeechProvider(
                mockHttpClient, objectMapper, "sk-valid-key", "https://api.openai.com/v1/audio/speech", "tts-1"
        );

        when(mockHttpClient.send(any(HttpRequest.class), eq(HttpResponse.BodyHandlers.ofByteArray())))
                .thenThrow(new IOException("Connection reset by peer"));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                provider.synthesizeSpeech("Test text", "alloy", 1.0)
        );
        assertTrue(ex.getMessage().contains("Speech synthesis error"));
    }

    @Test
    @DisplayName("Local TTS returns LOCAL_TTS provider name and handles disabled state")
    void testLocalProviderDisabledState() {
        LocalTextToSpeechProvider localProvider = new LocalTextToSpeechProvider(
                mockHttpClient, "http://localhost:5000/api/tts", false
        );

        assertEquals("LOCAL_TTS", localProvider.getProviderName());
        assertFalse(localProvider.isAvailable());

        assertThrows(IllegalStateException.class, () ->
                localProvider.synthesizeSpeech("Test text", "default", 1.0)
        );
    }
}
