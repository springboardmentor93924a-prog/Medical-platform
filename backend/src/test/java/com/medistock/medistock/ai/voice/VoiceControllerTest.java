package com.medistock.medistock.ai.voice;

import com.medistock.medistock.ai.chat.ChatOrchestratorService;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.voice.controller.VoiceController;
import com.medistock.medistock.ai.voice.dto.VoiceChatRequestDto;
import com.medistock.medistock.ai.voice.dto.VoiceTranscriptionDto;
import com.medistock.medistock.ai.voice.dto.VoiceSessionDto;
import com.medistock.medistock.ai.voice.dto.VoiceSpeakRequestDto;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class VoiceControllerTest {

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
        sessionManager = mock(LiveVoiceSessionManager.class);

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
    @DisplayName("GET /status returns voice provider availability and browser fallback support")
    void testGetVoiceStatus() {
        when(cloudSttProvider.isAvailable()).thenReturn(true);
        when(cloudSttProvider.getProviderName()).thenReturn("OPENAI_WHISPER");
        when(localSttProvider.isAvailable()).thenReturn(false);
        when(localSttProvider.getProviderName()).thenReturn("LOCAL_WHISPER");
        when(cloudTtsProvider.isAvailable()).thenReturn(true);
        when(cloudTtsProvider.getProviderName()).thenReturn("OPENAI_TTS");
        when(localTtsProvider.isAvailable()).thenReturn(false);
        when(localTtsProvider.getProviderName()).thenReturn("LOCAL_TTS");

        ResponseEntity<ApiResponse<Map<String, Object>>> response = voiceController.getVoiceStatus();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        Map<String, Object> data = response.getBody().getData();
        assertEquals(true, data.get("cloudSttAvailable"));
        assertEquals("OPENAI_WHISPER", data.get("cloudSttProvider"));
        assertEquals(false, data.get("localSttAvailable"));
        assertEquals(true, data.get("cloudTtsAvailable"));
        assertEquals("OPENAI_TTS", data.get("cloudTtsProvider"));
        assertEquals(false, data.get("localTtsAvailable"));
        assertEquals(true, data.get("browserFallbackSupported"));
        assertEquals(true, data.get("browserFallbackSupported"));
    }

    @Test
    @DisplayName("POST /transcribe returns 401 when user is not authenticated")
    void testTranscribeUnauthenticated() {
        when(currentUserService.getCurrentUserId()).thenReturn(null);
        MockMultipartFile file = new MockMultipartFile("file", "test.webm", "audio/webm", new byte[]{1, 2, 3});

        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> response = voiceController.transcribeAudio(file, "en");

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("POST /transcribe returns 400 when file is empty")
    void testTranscribeEmptyFile() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        MockMultipartFile file = new MockMultipartFile("file", "empty.webm", "audio/webm", new byte[0]);

        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> response = voiceController.transcribeAudio(file, "en");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("POST /transcribe delegates to Cloud STT provider when available")
    void testTranscribeCloudSuccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(2);
        when(cloudSttProvider.isAvailable()).thenReturn(true);
        when(cloudSttProvider.transcribe(any(), any(), any(), eq("en")))
                .thenReturn(VoiceTranscriptionDto.of("Show all low stock medicines", "en", 0.99, 3.5, "OPENAI_WHISPER"));

        byte[] sampleAudio = "sample-audio-bytes".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "audio.webm", "audio/webm", sampleAudio);

        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> response = voiceController.transcribeAudio(file, "en");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        VoiceTranscriptionDto dto = response.getBody().getData();
        assertEquals("Show all low stock medicines", dto.text());
        assertEquals("OPENAI_WHISPER", dto.provider());
        assertEquals(3.5, dto.durationSeconds());
    }

    @Test
    @DisplayName("POST /transcribe falls back to Local STT when Cloud is unavailable")
    void testTranscribeLocalFallbackSuccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(2);
        when(cloudSttProvider.isAvailable()).thenReturn(false);
        when(localSttProvider.isAvailable()).thenReturn(true);
        when(localSttProvider.transcribe(any(), any(), any(), any()))
                .thenReturn(VoiceTranscriptionDto.of("Check Paracetamol expiry", "en", 0.95, 2.1, "LOCAL_WHISPER"));

        byte[] sampleAudio = "local-audio-bytes".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "audio.wav", "audio/wav", sampleAudio);

        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> response = voiceController.transcribeAudio(file, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Check Paracetamol expiry", response.getBody().getData().text());
        assertEquals("LOCAL_WHISPER", response.getBody().getData().provider());
    }

    @Test
    @DisplayName("POST /chat dispatches voice query through ChatOrchestratorService")
    void testProcessVoiceChatSuccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        ChatReplyDto replyDto = new ChatReplyDto(
                10,
                "There are 8 medicines with low stock.",
                "OLLAMA_LOCAL",
                "query_low_stock_medicines",
                null
        );
        when(chatOrchestratorService.handleUserMessage(eq(10), eq("Which medicines are low in stock?"), eq(1)))
                .thenReturn(replyDto);

        VoiceChatRequestDto request = new VoiceChatRequestDto(
                10,
                "Which medicines are low in stock?",
                "en",
                false
        );

        ResponseEntity<ApiResponse<ChatReplyDto>> response = voiceController.processVoiceChat(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        ChatReplyDto body = response.getBody().getData();
        assertEquals(10, body.getSessionId());
        assertEquals("query_low_stock_medicines", body.getToolUsed());
        assertEquals("There are 8 medicines with low stock.", body.getReply());
        verify(chatOrchestratorService, times(1)).handleUserMessage(10, "Which medicines are low in stock?", 1);
    }

    @Test
    @DisplayName("POST /chat returns 400 when message is empty")
    void testProcessVoiceChatEmptyMessage() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        VoiceChatRequestDto request = new VoiceChatRequestDto(10, "   ", "en", false);

        ResponseEntity<ApiResponse<ChatReplyDto>> response = voiceController.processVoiceChat(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("POST /speak returns audio/mpeg stream when Cloud TTS is available")
    void testSpeakTextCloudSuccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        when(cloudTtsProvider.isAvailable()).thenReturn(true);
        byte[] fakeMp3 = new byte[]{0x49, 0x44, 0x33, 0x03, 0x00}; // ID3 header
        when(cloudTtsProvider.synthesizeSpeech(eq("Paracetamol has 450 units."), eq("alloy"), eq(1.0)))
                .thenReturn(fakeMp3);

        VoiceSpeakRequestDto request = VoiceSpeakRequestDto.of("Paracetamol has 450 units.");
        ResponseEntity<?> response = voiceController.speakText(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.parseMediaType("audio/mpeg"), response.getHeaders().getContentType());
        assertArrayEquals(fakeMp3, (byte[]) response.getBody());
    }

    @Test
    @DisplayName("POST /speak returns 401 when user is not authenticated")
    void testSpeakTextUnauthenticated() {
        when(currentUserService.getCurrentUserId()).thenReturn(null);
        VoiceSpeakRequestDto request = VoiceSpeakRequestDto.of("Hello");

        ResponseEntity<?> response = voiceController.speakText(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("POST /speak returns 400 when text is empty")
    void testSpeakTextEmptyText() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        VoiceSpeakRequestDto request = VoiceSpeakRequestDto.of("   ");

        ResponseEntity<?> response = voiceController.speakText(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("POST /speak returns 503 when backend TTS is unavailable to prompt browser synthesis")
    void testSpeakTextUnavailableFallback() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        when(cloudTtsProvider.isAvailable()).thenReturn(false);
        when(localTtsProvider.isAvailable()).thenReturn(false);

        VoiceSpeakRequestDto request = VoiceSpeakRequestDto.of("Medicines are available.");
        ResponseEntity<?> response = voiceController.speakText(request);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    }

    @Test
    @DisplayName("POST /session creates a live voice session for authenticated user")
    void testCreateLiveSessionSuccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        VoiceSessionDto dto = VoiceSessionDto.active("vlive_12345", 1, "LIVE_VOICE");
        when(sessionManager.createSession(eq(1), eq("LIVE_VOICE"))).thenReturn(dto);

        ResponseEntity<ApiResponse<VoiceSessionDto>> response = voiceController.createLiveSession("LIVE_VOICE");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("vlive_12345", response.getBody().getData().sessionId());
        assertEquals("ACTIVE", response.getBody().getData().status());
    }

    @Test
    @DisplayName("GET /session/{id} returns active live session")
    void testGetLiveSessionSuccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        VoiceSessionDto dto = VoiceSessionDto.active("vlive_12345", 1, "LIVE_VOICE");
        when(sessionManager.getSession("vlive_12345", 1)).thenReturn(dto);

        ResponseEntity<ApiResponse<VoiceSessionDto>> response = voiceController.getLiveSession("vlive_12345");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("vlive_12345", response.getBody().getData().sessionId());
    }

    @Test
    @DisplayName("DELETE /session/{id} closes session successfully")
    void testCloseLiveSessionSuccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        doNothing().when(sessionManager).closeSession("vlive_12345", 1);

        ResponseEntity<ApiResponse<Map<String, String>>> response = voiceController.closeLiveSession("vlive_12345");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(sessionManager, times(1)).closeSession("vlive_12345", 1);
    }
}
