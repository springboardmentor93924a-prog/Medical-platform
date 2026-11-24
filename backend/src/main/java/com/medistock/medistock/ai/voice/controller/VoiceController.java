package com.medistock.medistock.ai.voice.controller;

import com.medistock.medistock.ai.chat.ChatOrchestratorService;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.voice.dto.VoiceChatRequestDto;
import com.medistock.medistock.ai.voice.dto.VoiceSessionDto;
import com.medistock.medistock.ai.voice.dto.VoiceSpeakRequestDto;
import com.medistock.medistock.ai.voice.dto.VoiceTranscriptionDto;
import com.medistock.medistock.ai.voice.live.LiveVoiceSessionManager;
import com.medistock.medistock.ai.voice.stt.CloudSpeechToTextProvider;
import com.medistock.medistock.ai.voice.stt.LocalSpeechToTextProvider;
import com.medistock.medistock.ai.voice.tts.CloudTextToSpeechProvider;
import com.medistock.medistock.ai.voice.tts.LocalTextToSpeechProvider;
import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.service.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/ai/voice")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
public class VoiceController {

    private static final Logger log = LoggerFactory.getLogger(VoiceController.class);

    private final ChatOrchestratorService chatOrchestratorService;
    private final CurrentUserService currentUserService;
    private final CloudSpeechToTextProvider cloudSttProvider;
    private final LocalSpeechToTextProvider localSttProvider;
    private final CloudTextToSpeechProvider cloudTtsProvider;
    private final LocalTextToSpeechProvider localTtsProvider;
    private final LiveVoiceSessionManager sessionManager;

    public VoiceController(
            ChatOrchestratorService chatOrchestratorService,
            CurrentUserService currentUserService,
            CloudSpeechToTextProvider cloudSttProvider,
            LocalSpeechToTextProvider localSttProvider,
            CloudTextToSpeechProvider cloudTtsProvider,
            LocalTextToSpeechProvider localTtsProvider,
            LiveVoiceSessionManager sessionManager) {
        this.chatOrchestratorService = chatOrchestratorService;
        this.currentUserService = currentUserService;
        this.cloudSttProvider = cloudSttProvider;
        this.localSttProvider = localSttProvider;
        this.cloudTtsProvider = cloudTtsProvider;
        this.localTtsProvider = localTtsProvider;
        this.sessionManager = sessionManager;
    }

    /**
     * Transcribes an uploaded voice audio recording into text.
     */
    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<VoiceTranscriptionDto>> transcribeAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "language", required = false) String language) {

        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Audio recording file cannot be empty."));
        }

        // Maximum audio file size constraint: 20 MB
        if (file.getSize() > 20 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Audio file exceeds maximum permitted size of 20 MB."));
        }

        // Whitelist permitted audio MIME-types for security
        String mimeType = file.getContentType();
        if (mimeType != null && !mimeType.isBlank()) {
            String lowerMime = mimeType.toLowerCase();
            boolean isAudio = lowerMime.startsWith("audio/") || lowerMime.contains("webm") || lowerMime.contains("wav") || lowerMime.contains("mp4");
            if (!isAudio) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid audio format. Permitted formats: webm, wav, ogg, mp4."));
            }
        }

        try {
            byte[] bytes = file.getBytes();
            String filename = file.getOriginalFilename();

            VoiceTranscriptionDto result;
            if (cloudSttProvider.isAvailable()) {
                result = cloudSttProvider.transcribe(bytes, filename, mimeType, language);
            } else if (localSttProvider.isAvailable()) {
                result = localSttProvider.transcribe(bytes, filename, mimeType, language);
            } else {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ApiResponse.error("Neither Cloud Whisper nor Local STT service is configured. Falling back to browser speech recognition."));
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate")
                    .body(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("[VoiceController] Transcription failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Voice transcription failed: " + e.getMessage()));
        }
    }

    /**
     * Dispatches a transcribed voice message through the shared AI chat orchestrator.
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatReplyDto>> processVoiceChat(@RequestBody VoiceChatRequestDto request) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        if (request.message() == null || request.message().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Spoken message text cannot be empty."));
        }

        try {
            ChatReplyDto reply = chatOrchestratorService.handleUserMessage(request.sessionId(), request.message(), userId);
            return ResponseEntity.ok(ApiResponse.ok(reply));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("[VoiceController] Voice chat processing failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Voice AI processing failed: " + e.getMessage()));
        }
    }

    /**
     * Synthesizes text into high-fidelity streaming MP3 audio.
     */
    @PostMapping(value = "/speak", produces = "audio/mpeg")
    public ResponseEntity<?> speakText(@RequestBody VoiceSpeakRequestDto request) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        if (request.text() == null || request.text().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Text for speech synthesis cannot be empty."));
        }

        try {
            byte[] audioBytes = null;
            if (cloudTtsProvider.isAvailable()) {
                audioBytes = cloudTtsProvider.synthesizeSpeech(request.text(), request.voice(), request.speed());
            } else if (localTtsProvider.isAvailable()) {
                audioBytes = localTtsProvider.synthesizeSpeech(request.text(), request.voice(), request.speed());
            }

            if (audioBytes != null && audioBytes.length > 0) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("audio/mpeg"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"speech.mp3\"")
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                        .body(audioBytes);
            } else {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("Backend TTS is not configured. Falling back to browser speech synthesis."));
            }
        } catch (Exception e) {
            log.error("[VoiceController] Speech synthesis failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error("Speech generation failed: " + e.getMessage()));
        }
    }

    /**
     * Diagnostic endpoint reporting status of voice recognition and speech subsystems.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVoiceStatus() {
        Map<String, Object> status = new java.util.LinkedHashMap<>();
        status.put("cloudSttAvailable", cloudSttProvider != null && cloudSttProvider.isAvailable());
        status.put("cloudSttProvider", (cloudSttProvider != null && cloudSttProvider.getProviderName() != null) ? cloudSttProvider.getProviderName() : "NONE");
        status.put("localSttAvailable", localSttProvider != null && localSttProvider.isAvailable());
        status.put("localSttProvider", (localSttProvider != null && localSttProvider.getProviderName() != null) ? localSttProvider.getProviderName() : "NONE");
        status.put("cloudTtsAvailable", cloudTtsProvider != null && cloudTtsProvider.isAvailable());
        status.put("cloudTtsProvider", (cloudTtsProvider != null && cloudTtsProvider.getProviderName() != null) ? cloudTtsProvider.getProviderName() : "NONE");
        status.put("localTtsAvailable", localTtsProvider != null && localTtsProvider.isAvailable());
        status.put("localTtsProvider", (localTtsProvider != null && localTtsProvider.getProviderName() != null) ? localTtsProvider.getProviderName() : "NONE");
        status.put("browserFallbackSupported", true);

        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    /**
     * Initializes a Live Voice Conversation session.
     */
    @PostMapping("/session")
    public ResponseEntity<ApiResponse<VoiceSessionDto>> createLiveSession(
            @RequestParam(value = "mode", required = false) String mode) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        VoiceSessionDto session = sessionManager.createSession(userId, mode != null ? mode : "LIVE_VOICE");
        return ResponseEntity.ok(ApiResponse.ok(session));
    }

    /**
     * Retrieves status and health of an active live voice session.
     */
    @GetMapping("/session/{id}")
    public ResponseEntity<ApiResponse<VoiceSessionDto>> getLiveSession(@PathVariable("id") String sessionId) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        try {
            VoiceSessionDto session = sessionManager.getSession(sessionId, userId);
            return ResponseEntity.ok(ApiResponse.ok(session));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Closes an active live voice session.
     */
    @DeleteMapping("/session/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> closeLiveSession(@PathVariable("id") String sessionId) {
        Integer userId = currentUserService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("User not authenticated"));
        }

        try {
            sessionManager.closeSession(sessionId, userId);
            return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Live voice session closed successfully")));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        }
    }
}

