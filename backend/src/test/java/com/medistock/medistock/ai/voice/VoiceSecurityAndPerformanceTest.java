package com.medistock.medistock.ai.voice;

import com.medistock.medistock.ai.chat.ChatOrchestratorService;
import com.medistock.medistock.ai.voice.controller.VoiceController;
import com.medistock.medistock.ai.voice.dto.VoiceSessionDto;
import com.medistock.medistock.ai.voice.dto.VoiceTranscriptionDto;
import com.medistock.medistock.ai.voice.live.LiveVoiceSessionManager;
import com.medistock.medistock.ai.voice.stt.CloudSpeechToTextProvider;
import com.medistock.medistock.ai.voice.stt.LocalSpeechToTextProvider;
import com.medistock.medistock.ai.voice.tts.CloudTextToSpeechProvider;
import com.medistock.medistock.ai.voice.tts.LocalTextToSpeechProvider;
import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.service.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VoiceSecurityAndPerformanceTest {

    private ChatOrchestratorService chatOrchestratorService;
    private CurrentUserService currentUserService;
    private CloudSpeechToTextProvider cloudSttProvider;
    private LocalSpeechToTextProvider localSttProvider;
    private CloudTextToSpeechProvider cloudTtsProvider;
    private LocalTextToSpeechProvider localTtsProvider;
    private LiveVoiceSessionManager sessionManager;
    private VoiceController voiceController;

    @BeforeEach
    void setUp() {
        chatOrchestratorService = mock(ChatOrchestratorService.class);
        currentUserService = mock(CurrentUserService.class);
        cloudSttProvider = mock(CloudSpeechToTextProvider.class);
        localSttProvider = mock(LocalSpeechToTextProvider.class);
        cloudTtsProvider = mock(CloudTextToSpeechProvider.class);
        localTtsProvider = mock(LocalTextToSpeechProvider.class);
        sessionManager = new LiveVoiceSessionManager(); // Test real session manager logic

        voiceController = new VoiceController(
                chatOrchestratorService,
                currentUserService,
                cloudSttProvider,
                localSttProvider,
                cloudTtsProvider,
                localTtsProvider,
                sessionManager
        );
    }

    @Test
    @DisplayName("Security: Audio upload rejects non-audio MIME types (e.g. text/html, application/x-msdownload)")
    void testAudioUploadRejectsInvalidMimeType() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file",
                "exploit.html",
                "text/html",
                "<html><body>malicious payload</body></html>".getBytes()
        );

        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> response = voiceController.transcribeAudio(maliciousFile, "en");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getMessage().contains("Invalid audio format"));
    }

    @Test
    @DisplayName("Security: Audio upload rejects files exceeding 20 MB threshold")
    void testAudioUploadRejectsExceededSize() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        // Create 21MB mock payload
        byte[] oversizedData = new byte[21 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "giant_audio.webm",
                "audio/webm",
                oversizedData
        );

        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> response = voiceController.transcribeAudio(largeFile, "en");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("exceeds maximum permitted size"));
    }

    @Test
    @DisplayName("Privacy: Successful voice transcription returns no-store Cache-Control headers")
    void testVoiceUploadSetsNoStoreCacheHeaders() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        when(cloudSttProvider.isAvailable()).thenReturn(true);
        when(cloudSttProvider.transcribe(any(), any(), any(), any()))
                .thenReturn(VoiceTranscriptionDto.of("Paracetamol stock level", "en", 0.99, 2.0, "OPENAI_WHISPER"));

        MockMultipartFile validFile = new MockMultipartFile(
                "file",
                "note.webm",
                "audio/webm",
                new byte[]{10, 20, 30}
        );

        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> response = voiceController.transcribeAudio(validFile, "en");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("no-store, no-cache, must-revalidate", response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL));
    }

    @Test
    @DisplayName("Performance & Rate Limiting: LiveVoiceSessionManager enforces max 3 concurrent sessions per user by evicting oldest")
    void testLiveSessionEnforcesMaxConcurrentLimitPerUser() {
        Integer userId = 42;

        VoiceSessionDto s1 = sessionManager.createSession(userId, "LIVE_VOICE");
        VoiceSessionDto s2 = sessionManager.createSession(userId, "LIVE_VOICE");
        VoiceSessionDto s3 = sessionManager.createSession(userId, "LIVE_VOICE");

        // Exactly 3 sessions active
        assertEquals(3, sessionManager.getActiveSessionCount());

        // Creating 4th session triggers quota eviction of oldest (s1)
        VoiceSessionDto s4 = sessionManager.createSession(userId, "LIVE_VOICE");
        assertEquals(3, sessionManager.getActiveSessionCount());

        // Verify s4 exists, and s1 was evicted
        assertNotNull(sessionManager.getSession(s4.sessionId(), userId));
        assertThrows(java.util.NoSuchElementException.class, () -> sessionManager.getSession(s1.sessionId(), userId));
    }

    @Test
    @DisplayName("Security: Access to a live session owned by another user is strictly denied (403 Forbidden)")
    void testLiveSessionAccessDeniedForDifferentUser() {
        Integer userAlice = 100;
        Integer userBob = 200;

        VoiceSessionDto aliceSession = sessionManager.createSession(userAlice, "LIVE_VOICE");

        // Alice can access her own session
        assertNotNull(sessionManager.getSession(aliceSession.sessionId(), userAlice));

        // Bob attempting to get Alice's session triggers SecurityException
        assertThrows(SecurityException.class, () -> sessionManager.getSession(aliceSession.sessionId(), userBob));

        // Bob attempting to close Alice's session triggers SecurityException
        assertThrows(SecurityException.class, () -> sessionManager.closeSession(aliceSession.sessionId(), userBob));
    }
}

