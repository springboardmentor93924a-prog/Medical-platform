package com.medistock.medistock.ai.voice.stt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medistock.medistock.ai.voice.dto.VoiceTranscriptionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

@Component
public class LocalSpeechToTextProvider implements SpeechToTextProvider {

    private static final Logger log = LoggerFactory.getLogger(LocalSpeechToTextProvider.class);

    @Value("${medistock.ai.voice.local-stt-url:http://localhost:8000/v1/audio/transcriptions}")
    private String localSttUrl;

    @Value("${medistock.ai.voice.local-stt-enabled:false}")
    private boolean enabled;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public LocalSpeechToTextProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public LocalSpeechToTextProvider(HttpClient httpClient, ObjectMapper objectMapper, String localSttUrl, boolean enabled) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.localSttUrl = localSttUrl;
        this.enabled = enabled;
    }

    @Override
    public String getProviderName() {
        return "LOCAL_WHISPER";
    }

    @Override
    public boolean isAvailable() {
        if (!enabled) {
            return false;
        }
        try {
            HttpRequest ping = HttpRequest.newBuilder()
                    .uri(URI.create(localSttUrl.replace("/transcriptions", "/models")))
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
    public VoiceTranscriptionDto transcribe(byte[] audioBytes, String filename, String mimeType, String language) {
        if (!isAvailable()) {
            throw new IllegalStateException("Local STT service is currently unreachable on " + localSttUrl);
        }

        try {
            String boundary = "===LocalSTTBoundary" + UUID.randomUUID().toString().replace("-", "");
            ByteArrayOutputStream bos = new ByteArrayOutputStream();

            bos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + (filename != null ? filename : "audio.wav") + "\"\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write(("Content-Type: " + (mimeType != null ? mimeType : "audio/wav") + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write(audioBytes);
            bos.write("\r\n".getBytes(StandardCharsets.UTF_8));

            bos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write("Content-Disposition: form-data; name=\"model\"\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            bos.write("whisper".getBytes(StandardCharsets.UTF_8));
            bos.write("\r\n".getBytes(StandardCharsets.UTF_8));

            bos.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(localSttUrl))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bos.toByteArray()))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String text = root.path("text").asText("");
                return VoiceTranscriptionDto.of(text.trim(), language != null ? language : "en", 0.95, 0.0, getProviderName());
            } else {
                throw new RuntimeException("Local STT error HTTP " + response.statusCode());
            }
        } catch (Exception e) {
            log.warn("[Local STT] Transcription failed: {}", e.getMessage());
            throw new RuntimeException("Local STT failure: " + e.getMessage(), e);
        }
    }
}

