package com.medistock.medistock.ai.voice.tts;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class LocalTextToSpeechProvider implements TextToSpeechProvider {

    private static final Logger log = LoggerFactory.getLogger(LocalTextToSpeechProvider.class);

    @Value("${medistock.ai.voice.local-tts-url:http://localhost:5000/api/tts}")
    private String localTtsUrl;

    @Value("${medistock.ai.voice.local-tts-enabled:false}")
    private boolean enabled;

    private final HttpClient httpClient;

    public LocalTextToSpeechProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    public LocalTextToSpeechProvider(HttpClient httpClient, String localTtsUrl, boolean enabled) {
        this.httpClient = httpClient;
        this.localTtsUrl = localTtsUrl;
        this.enabled = enabled;
    }

    @Override
    public String getProviderName() {
        return "LOCAL_TTS";
    }

    @Override
    public boolean isAvailable() {
        if (!enabled) {
            return false;
        }
        try {
            HttpRequest ping = HttpRequest.newBuilder()
                    .uri(URI.create(localTtsUrl.replace("/tts", "/health")))
                    .GET()
                    .timeout(Duration.ofMillis(800))
                    .build();
            HttpResponse<Void> resp = httpClient.send(ping, HttpResponse.BodyHandlers.discarding());
            return resp.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public byte[] synthesizeSpeech(String text, String voice, Double speed) {
        if (!isAvailable()) {
            throw new IllegalStateException("Local TTS engine is not available on " + localTtsUrl);
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(localTtsUrl))
                    .header("Content-Type", "text/plain")
                    .POST(HttpRequest.BodyPublishers.ofString(text))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return response.body();
            } else {
                throw new RuntimeException("Local TTS returned HTTP status " + response.statusCode());
            }
        } catch (Exception e) {
            log.warn("[Local TTS] Synthesis error: {}", e.getMessage());
            throw new RuntimeException("Local TTS error: " + e.getMessage(), e);
        }
    }
}

