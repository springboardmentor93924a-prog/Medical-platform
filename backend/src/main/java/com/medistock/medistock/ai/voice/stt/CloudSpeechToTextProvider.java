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
public class CloudSpeechToTextProvider implements SpeechToTextProvider {

    private static final Logger log = LoggerFactory.getLogger(CloudSpeechToTextProvider.class);

    @Value("${medistock.ai.api.key:}")
    private String apiKey;

    @Value("${medistock.ai.voice.whisper-url:https://api.openai.com/v1/audio/transcriptions}")
    private String whisperUrl;

    @Value("${medistock.ai.voice.whisper-model:whisper-1}")
    private String whisperModel;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public CloudSpeechToTextProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public CloudSpeechToTextProvider(HttpClient httpClient, ObjectMapper objectMapper, String apiKey, String whisperUrl, String whisperModel) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.whisperUrl = whisperUrl;
        this.whisperModel = whisperModel;
    }

    @Override
    public String getProviderName() {
        return "OPENAI_WHISPER";
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("demo-key") && !apiKey.equalsIgnoreCase("none");
    }

    @Override
    public VoiceTranscriptionDto transcribe(byte[] audioBytes, String filename, String mimeType, String language) {
        if (!isAvailable()) {
            throw new IllegalStateException("Cloud Whisper STT is unavailable: OpenAI API key is not configured.");
        }

        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalArgumentException("Audio payload cannot be empty.");
        }

        String safeFilename = (filename != null && !filename.isBlank()) ? filename : "voice_note.webm";
        String safeMime = (mimeType != null && !mimeType.isBlank()) ? mimeType : "audio/webm";

        try {
            String boundary = "===MediStockSTTBoundary" + UUID.randomUUID().toString().replace("-", "");
            ByteArrayOutputStream bos = new ByteArrayOutputStream();

            // 1. Audio file field
            bos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + safeFilename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write(("Content-Type: " + safeMime + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write(audioBytes);
            bos.write("\r\n".getBytes(StandardCharsets.UTF_8));

            // 2. Model field
            bos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write("Content-Disposition: form-data; name=\"model\"\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            bos.write(whisperModel.getBytes(StandardCharsets.UTF_8));
            bos.write("\r\n".getBytes(StandardCharsets.UTF_8));

            // 3. Response format
            bos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            bos.write("Content-Disposition: form-data; name=\"response_format\"\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            bos.write("verbose_json".getBytes(StandardCharsets.UTF_8));
            bos.write("\r\n".getBytes(StandardCharsets.UTF_8));

            // 4. Optional Language hint
            if (language != null && !language.isBlank()) {
                bos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
                bos.write("Content-Disposition: form-data; name=\"language\"\r\n\r\n".getBytes(StandardCharsets.UTF_8));
                bos.write(language.getBytes(StandardCharsets.UTF_8));
                bos.write("\r\n".getBytes(StandardCharsets.UTF_8));
            }

            // Closing boundary
            bos.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(whisperUrl))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bos.toByteArray()))
                    .timeout(Duration.ofSeconds(12))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String text = root.path("text").asText("");
                String detectedLang = root.path("language").asText(language != null ? language : "en");
                double duration = root.path("duration").asDouble(0.0);

                log.info("[Cloud STT] Transcribed {}s audio -> '{}'", duration, text);
                return VoiceTranscriptionDto.of(text.trim(), detectedLang, 0.98, duration, getProviderName());
            } else {
                log.warn("[Cloud STT] Whisper API failed with HTTP {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Whisper STT request failed with status " + response.statusCode());
            }
        } catch (java.net.http.HttpTimeoutException e) {
            log.warn("[Cloud STT] Request timed out after 12s: {}", e.getMessage());
            throw new RuntimeException("Cloud speech recognition timed out. Please try again or use local fallback.", e);
        } catch (Exception e) {
            log.error("[Cloud STT] Transcription failed: {}", e.getMessage(), e);
            throw new RuntimeException("Cloud speech transcription failed: " + e.getMessage(), e);
        }
    }
}

