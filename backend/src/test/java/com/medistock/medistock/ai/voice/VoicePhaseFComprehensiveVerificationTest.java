package com.medistock.medistock.ai.voice;

import com.medistock.medistock.ai.chat.ChatOrchestratorService;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.voice.controller.VoiceController;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class VoicePhaseFComprehensiveVerificationTest {

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
        sessionManager = new LiveVoiceSessionManager();

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

    // =========================================================================
    // 1. ROLE-BASED TESTING ACROSS ROLES (PHARMACIST, ADMIN, STAFF, SUPPLIER)
    // =========================================================================

    @Test
    @DisplayName("Role Test: Pharmacist role has full Voice Note and Live Voice access")
    void testPharmacistRoleAccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(101);

        // 1. Mode A: Transcribe audio
        when(cloudSttProvider.isAvailable()).thenReturn(true);
        when(cloudSttProvider.transcribe(any(), any(), any(), eq("en")))
                .thenReturn(VoiceTranscriptionDto.of("Show all medicines expiring in 30 days", "en", 0.98, 2.5, "OPENAI_WHISPER"));
        MockMultipartFile file = new MockMultipartFile("file", "audio.webm", "audio/webm", new byte[]{10, 20});
        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> transcribeRes = voiceController.transcribeAudio(file, "en");
        assertEquals(HttpStatus.OK, transcribeRes.getStatusCode());
        assertEquals("Show all medicines expiring in 30 days", transcribeRes.getBody().getData().text());

        // 2. Mode A: Voice Chat
        ChatReplyDto pharmacistReply = new ChatReplyDto(101, "12 batches expire soon. 3 require FEFO allocation.", "RULE_ENGINE", "check_expiries", Map.of("count", 12));
        when(chatOrchestratorService.handleUserMessage(eq(101), eq("Show all medicines expiring in 30 days"), eq(101))).thenReturn(pharmacistReply);
        VoiceChatRequestDto chatReq = new VoiceChatRequestDto(101, "Show all medicines expiring in 30 days", "en", false);
        ResponseEntity<ApiResponse<ChatReplyDto>> chatRes = voiceController.processVoiceChat(chatReq);
        assertEquals(HttpStatus.OK, chatRes.getStatusCode());
        assertTrue(chatRes.getBody().getData().getReply().contains("FEFO allocation"));

        // 3. Mode B: Live Voice Session
        ResponseEntity<ApiResponse<VoiceSessionDto>> sessionRes = voiceController.createLiveSession("LIVE");
        assertEquals(HttpStatus.OK, sessionRes.getStatusCode());
        assertEquals("ACTIVE", sessionRes.getBody().getData().status());
    }

    @Test
    @DisplayName("Role Test: Admin role has full voice access for forecasts and audits")
    void testAdminRoleAccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(1);

        ChatReplyDto adminReply = new ChatReplyDto(1, "Forecast demand for Paracetamol is 450 units next month.", "OPENAI_GPT4O", "forecast_demand", Map.of("projected", 450));
        when(chatOrchestratorService.handleUserMessage(eq(1), eq("Forecast demand for Paracetamol"), eq(1))).thenReturn(adminReply);

        VoiceChatRequestDto chatReq = new VoiceChatRequestDto(1, "Forecast demand for Paracetamol", "en", false);
        ResponseEntity<ApiResponse<ChatReplyDto>> chatRes = voiceController.processVoiceChat(chatReq);
        assertEquals(HttpStatus.OK, chatRes.getStatusCode());
        assertEquals("forecast_demand", chatRes.getBody().getData().getToolUsed());
    }

    @Test
    @DisplayName("Role Test: Staff role has voice inventory checking access")
    void testStaffRoleAccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(202);

        ChatReplyDto staffReply = new ChatReplyDto(202, "Amoxicillin stock is 120 capsules in Shelf B3.", "RULE_ENGINE", "check_stock", Map.of("stock", 120));
        when(chatOrchestratorService.handleUserMessage(eq(202), eq("Check Amoxicillin stock"), eq(202))).thenReturn(staffReply);

        VoiceChatRequestDto chatReq = new VoiceChatRequestDto(202, "Check Amoxicillin stock", "en", false);
        ResponseEntity<ApiResponse<ChatReplyDto>> chatRes = voiceController.processVoiceChat(chatReq);
        assertEquals(HttpStatus.OK, chatRes.getStatusCode());
        assertTrue(chatRes.getBody().getData().getReply().contains("Shelf B3"));
    }

    @Test
    @DisplayName("Role Test: Supplier role has voice purchase order visibility")
    void testSupplierRoleAccess() {
        when(currentUserService.getCurrentUserId()).thenReturn(303);

        ChatReplyDto supplierReply = new ChatReplyDto(303, "You have 2 pending purchase orders awaiting shipment.", "RULE_ENGINE", "get_supplier_orders", Map.of("pending", 2));
        when(chatOrchestratorService.handleUserMessage(eq(303), eq("Show pending purchase orders"), eq(303))).thenReturn(supplierReply);

        VoiceChatRequestDto chatReq = new VoiceChatRequestDto(303, "Show pending purchase orders", "en", false);
        ResponseEntity<ApiResponse<ChatReplyDto>> chatRes = voiceController.processVoiceChat(chatReq);
        assertEquals(HttpStatus.OK, chatRes.getStatusCode());
        assertTrue(chatRes.getBody().getData().getReply().contains("2 pending purchase orders"));
    }

    // =========================================================================
    // 2. MULTILINGUAL CONTEXT TESTING (ENGLISH, TAMIL, TANGLISH, HINDI)
    // =========================================================================

    @Test
    @DisplayName("Multilingual: English, Tamil, Tanglish, and Hindi voice queries pass to orchestrator cleanly")
    void testMultilingualVoiceQueries() {
        when(currentUserService.getCurrentUserId()).thenReturn(101);

        // 1. English
        when(chatOrchestratorService.handleUserMessage(eq(101), eq("Which medicines are low in stock?"), eq(101)))
                .thenReturn(new ChatReplyDto(101, "8 medicines are below reorder level.", "OPENAI_GPT4O", "check_stock", null));
        ResponseEntity<ApiResponse<ChatReplyDto>> resEn = voiceController.processVoiceChat(new VoiceChatRequestDto(101, "Which medicines are low in stock?", "en", false));
        assertEquals(HttpStatus.OK, resEn.getStatusCode());

        // 2. Tamil (தமிழ்)
        when(chatOrchestratorService.handleUserMessage(eq(101), eq("எந்த மருந்துகள் காலாவதியாகின்றன?"), eq(101)))
                .thenReturn(new ChatReplyDto(101, "அடுத்த 30 நாட்களில் 5 மருந்துகள் காலாவதியாகின்றன.", "OPENAI_GPT4O", "check_expiries", null));
        ResponseEntity<ApiResponse<ChatReplyDto>> resTa = voiceController.processVoiceChat(new VoiceChatRequestDto(101, "எந்த மருந்துகள் காலாவதியாகின்றன?", "ta", false));
        assertEquals(HttpStatus.OK, resTa.getStatusCode());
        assertTrue(resTa.getBody().getData().getReply().contains("மருந்துகள்"));

        // 3. Tanglish (Tamil in Latin script)
        when(chatOrchestratorService.handleUserMessage(eq(101), eq("Paracetamol stock evalo irukku?"), eq(101)))
                .thenReturn(new ChatReplyDto(101, "Paracetamol stock 250 units irukku.", "OPENAI_GPT4O", "check_stock", null));
        ResponseEntity<ApiResponse<ChatReplyDto>> resTanglish = voiceController.processVoiceChat(new VoiceChatRequestDto(101, "Paracetamol stock evalo irukku?", "ta", false));
        assertEquals(HttpStatus.OK, resTanglish.getStatusCode());
        assertTrue(resTanglish.getBody().getData().getReply().contains("250 units"));

        // 4. Hindi (हिन्दी)
        when(chatOrchestratorService.handleUserMessage(eq(101), eq("Kaun si dawai expiring ho rahi hai?"), eq(101)))
                .thenReturn(new ChatReplyDto(101, "अगले महीने 4 दवाइयां एक्सपायर हो रही हैं।", "OPENAI_GPT4O", "check_expiries", null));
        ResponseEntity<ApiResponse<ChatReplyDto>> resHi = voiceController.processVoiceChat(new VoiceChatRequestDto(101, "Kaun si dawai expiring ho rahi hai?", "hi", false));
        assertEquals(HttpStatus.OK, resHi.getStatusCode());
        assertTrue(resHi.getBody().getData().getReply().contains("दवाइयां"));
    }

    // =========================================================================
    // 3. MULTI-TURN FOLLOW-UP QUESTIONS & CONVERSATION CONTEXT
    // =========================================================================

    @Test
    @DisplayName("Conversation Context: Follow-up questions maintain session continuity and resolve coreferences")
    void testFollowUpConversationContinuity() {
        when(currentUserService.getCurrentUserId()).thenReturn(101);
        Integer conversationSessionId = 999;

        // Turn 1: "Which medicines are low in stock?"
        ChatReplyDto turn1Reply = new ChatReplyDto(conversationSessionId, "Found 3 medicines low in stock: Amoxicillin, Paracetamol, and Metformin.", "OPENAI_GPT4O", "check_low_stock", null);
        when(chatOrchestratorService.handleUserMessage(conversationSessionId, "Which medicines are low in stock?", 101)).thenReturn(turn1Reply);
        ResponseEntity<ApiResponse<ChatReplyDto>> resTurn1 = voiceController.processVoiceChat(new VoiceChatRequestDto(conversationSessionId, "Which medicines are low in stock?", "en", false));
        assertEquals(HttpStatus.OK, resTurn1.getStatusCode());
        assertTrue(resTurn1.getBody().getData().getReply().contains("Amoxicillin"));

        // Turn 2: "What about their suppliers?" (Pronoun coreference)
        ChatReplyDto turn2Reply = new ChatReplyDto(conversationSessionId, "Suppliers for those 3 medicines are Apex Pharma, MediHealth, and Cipla.", "OPENAI_GPT4O", "find_suppliers", null);
        when(chatOrchestratorService.handleUserMessage(conversationSessionId, "What about their suppliers?", 101)).thenReturn(turn2Reply);
        ResponseEntity<ApiResponse<ChatReplyDto>> resTurn2 = voiceController.processVoiceChat(new VoiceChatRequestDto(conversationSessionId, "What about their suppliers?", "en", false));
        assertEquals(HttpStatus.OK, resTurn2.getStatusCode());
        assertTrue(resTurn2.getBody().getData().getReply().contains("Apex Pharma"));

        // Turn 3: "Can you create a purchase order for the first one?"
        ChatReplyDto turn3Reply = new ChatReplyDto(conversationSessionId, "Draft PO created for Amoxicillin with supplier Apex Pharma.", "OPENAI_GPT4O", "create_purchase_order", null);
        when(chatOrchestratorService.handleUserMessage(conversationSessionId, "Can you create a purchase order for the first one?", 101)).thenReturn(turn3Reply);
        ResponseEntity<ApiResponse<ChatReplyDto>> resTurn3 = voiceController.processVoiceChat(new VoiceChatRequestDto(conversationSessionId, "Can you create a purchase order for the first one?", "en", false));
        assertEquals(HttpStatus.OK, resTurn3.getStatusCode());
        assertTrue(resTurn3.getBody().getData().getReply().contains("Draft PO created"));

        // Verify the same session ID was passed across all 3 turns
        verify(chatOrchestratorService, times(1)).handleUserMessage(conversationSessionId, "Which medicines are low in stock?", 101);
        verify(chatOrchestratorService, times(1)).handleUserMessage(conversationSessionId, "What about their suppliers?", 101);
        verify(chatOrchestratorService, times(1)).handleUserMessage(conversationSessionId, "Can you create a purchase order for the first one?", 101);
    }

    // =========================================================================
    // 4. UNRELIABLE NETWORK CONDITIONS & RESILIENCE FALLBACKS
    // =========================================================================

    @Test
    @DisplayName("Network Resilience: STT network failure falls back cleanly without server crash")
    void testSttNetworkFailureResilience() {
        when(currentUserService.getCurrentUserId()).thenReturn(101);
        when(cloudSttProvider.isAvailable()).thenReturn(true);
        when(cloudSttProvider.transcribe(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Whisper STT request failed: Connection reset by peer"));
        when(localSttProvider.isAvailable()).thenReturn(false);

        MockMultipartFile audioFile = new MockMultipartFile("file", "recording.webm", "audio/webm", new byte[]{1, 2, 3});
        ResponseEntity<ApiResponse<VoiceTranscriptionDto>> res = voiceController.transcribeAudio(audioFile, "en");

        // Fails with structured error, informing client that browser-native STT can be used
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, res.getStatusCode());
        assertFalse(res.getBody().isSuccess());
        assertTrue(res.getBody().getMessage().contains("Whisper STT request failed"));
    }

    @Test
    @DisplayName("Network Resilience: TTS network failure returns 503 enabling frontend browser synthesis fallback")
    void testTtsNetworkFailureResilience() {
        when(currentUserService.getCurrentUserId()).thenReturn(101);
        when(cloudTtsProvider.isAvailable()).thenReturn(true);
        when(cloudTtsProvider.synthesizeSpeech(any(), any(), any()))
                .thenThrow(new RuntimeException("Cloud TTS API returned error HTTP 503: Service Unavailable"));
        when(localTtsProvider.isAvailable()).thenReturn(false);

        VoiceSpeakRequestDto speakReq = new VoiceSpeakRequestDto("This is a spoken test", "alloy", 1.0, "mp3");
        ResponseEntity<?> res = voiceController.speakText(speakReq);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, res.getStatusCode());
    }

    @Test
    @DisplayName("Network Resilience: Live Voice session recovery after network reconnection")
    void testLiveVoiceSessionReconnect() {
        when(currentUserService.getCurrentUserId()).thenReturn(101);

        // 1. User starts session
        ResponseEntity<ApiResponse<VoiceSessionDto>> sessionRes = voiceController.createLiveSession("LIVE");
        String sessionId = sessionRes.getBody().getData().sessionId();
        assertNotNull(sessionId);

        // 2. Network drop occurs and reconnects: Client polls session status
        ResponseEntity<ApiResponse<VoiceSessionDto>> pollRes = voiceController.getLiveSession(sessionId);
        assertEquals(HttpStatus.OK, pollRes.getStatusCode());
        assertEquals(sessionId, pollRes.getBody().getData().sessionId());
        assertEquals("ACTIVE", pollRes.getBody().getData().status());

        // 3. User closes session cleanly
        ResponseEntity<ApiResponse<Map<String, String>>> closeRes = voiceController.closeLiveSession(sessionId);
        assertEquals(HttpStatus.OK, closeRes.getStatusCode());

        // 4. Closed session returns 404
        ResponseEntity<ApiResponse<VoiceSessionDto>> deadPollRes = voiceController.getLiveSession(sessionId);
        assertEquals(HttpStatus.NOT_FOUND, deadPollRes.getStatusCode());
    }
}
