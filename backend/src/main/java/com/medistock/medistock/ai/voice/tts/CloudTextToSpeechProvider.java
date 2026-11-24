package com.medistock.medistock.ai.voice.tts;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class CloudTextToSpeechProvider implements TextToSpeechProvider {

    private static final Logger log = LoggerFactory.getLogger(CloudTextToSpeechProvider.class);

    @Value("${medistock.ai.api.key:}")
    private String apiKey;

    @Value("${medistock.ai.voice.tts-url:https://api.openai.com/v1/audio/speech}")
    private String ttsUrl;

    @Value("${medistock.ai.voice.tts-model:tts-1}")
    private String ttsModel;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public CloudTextToSpeechProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public CloudTextToSpeechProvider(HttpClient httpClient, ObjectMapper objectMapper, String apiKey, String ttsUrl, String ttsModel) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.ttsUrl = ttsUrl;
        this.ttsModel = ttsModel;
    }

    @Override
    public String getProviderName() {
        return "OPENAI_TTS";
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("demo-key") && !apiKey.equalsIgnoreCase("none");
    }

    @Override
    public byte[] synthesizeSpeech(String text, String voice, Double speed) {
        if (!isAvailable()) {
            throw new IllegalStateException("Cloud TTS is unavailable: OpenAI API key is not configured.");
        }

        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Text for speech synthesis cannot be empty.");
        }

        // Clean markdown symbols to make spoken speech natural
        String cleanInput = cleanMarkdownForSpeech(text);
        String selectedVoice = (voice != null && !voice.isBlank()) ? voice : "alloy";
        double playbackSpeed = (speed != null && speed > 0.0) ? speed : 1.0;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", ttsModel);
            payload.put("input", cleanInput);
            payload.put("voice", selectedVoice);
            payload.put("response_format", "mp3");
            payload.put("speed", playbackSpeed);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ttsUrl))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("[Cloud TTS] Successfully synthesized {} chars into {} audio bytes", cleanInput.length(), response.body().length);
                return response.body();
            } else {
                log.warn("[Cloud TTS] OpenAI TTS failed with HTTP status {}: {}", response.statusCode(), new String(response.body()));
                throw new RuntimeException("Cloud TTS API returned error HTTP " + response.statusCode());
            }
        } catch (java.net.http.HttpTimeoutException e) {
            log.warn("[Cloud TTS] Synthesis timed out after 10s: {}", e.getMessage());
            throw new RuntimeException("Cloud speech synthesis timed out. Switching to browser synthesis fallback.", e);
        } catch (Exception e) {
            log.error("[Cloud TTS] Speech generation error: {}", e.getMessage(), e);
            throw new RuntimeException("Speech synthesis error: " + e.getMessage(), e);
        }
    }

    private String cleanMarkdownForSpeech(String raw) {
        if (raw == null) return "";
        return raw.replaceAll("\\*\\*(.*?)\\*\\*", "$1")
                .replaceAll("\\*(.*?)\\*", "$1")
                .replaceAll("`{1,3}[^`]*`{1,3}", "")
                .replaceAll("#+\\s*", "")
                .replaceAll("\\|[\\s\\S]*?\\|", "")
                .replaceAll("<[^>]*>", "")
                .replaceAll("\n+", " ")
                .trim();
    }
}

