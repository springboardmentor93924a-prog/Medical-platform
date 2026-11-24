package com.medistock.medistock.ai.voice;

import com.medistock.medistock.ai.chat.ChatOrchestratorService;
import com.medistock.medistock.ai.chat.MediStockPromptBuilder;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.entity.AIChatMessage;
import com.medistock.medistock.ai.entity.AIChatSession;
import com.medistock.medistock.ai.voice.controller.VoiceController;
import com.medistock.medistock.ai.voice.dto.VoiceChatRequestDto;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class VoiceConversationIntelligenceTest {

    private ChatOrchestratorService chatOrchestratorService;
    private CurrentUserService currentUserService;
    private CloudSpeechToTextProvider cloudSttProvider;
    private LocalSpeechToTextProvider localSttProvider;
    private CloudTextToSpeechProvider cloudTtsProvider;
    private LocalTextToSpeechProvider localTtsProvider;
    private LiveVoiceSessionManager sessionManager;
    private MediStockPromptBuilder promptBuilder;
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
        promptBuilder = new MediStockPromptBuilder(null);

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
    @DisplayName("PromptBuilder embeds Voice Conversation, Coreference Resolution, and Multilingual Guidelines")
    void testPromptBuilderIncludesVoiceAndMultilingualDirectives() {
        String systemPrompt = promptBuilder.buildSystemPrompt(
                "What about their suppliers?",
                "PHARMACIST",
                "Dr. Jennifer Adams"
        );

        assertNotNull(systemPrompt);
        assertTrue(systemPrompt.contains("VOICE CONVERSATION & MEMORY GUIDANCE"));
        assertTrue(systemPrompt.contains("Coreference Resolution"));
        assertTrue(systemPrompt.contains("Tamil (தமிழ்)"));
        assertTrue(systemPrompt.contains("Tanglish"));
        assertTrue(systemPrompt.contains("Hindi (हिन्दी & Hinglish)"));
        assertTrue(systemPrompt.contains("Zero Fabrication: NEVER guess"));
    }

    @Test
    @DisplayName("Live Voice Multi-Turn: Turn 1 Low Stock followed by Turn 2 'What about their suppliers?' retains session memory")
    void testMultiTurnFollowUpConversationMemory() {
        when(currentUserService.getCurrentUserId()).thenReturn(2);

        // Turn 1: "Which medicines are low in stock?"
        ChatReplyDto turn1Reply = new ChatReplyDto(
                55,
                "I found 8 medicines below their reorder levels. Paracetamol and Amoxicillin need urgent attention.",
                "OLLAMA_LOCAL",
                "query_low_stock_medicines",
                null
        );
        when(chatOrchestratorService.handleUserMessage(eq(55), eq("Which medicines are low in stock?"), eq(2)))
                .thenReturn(turn1Reply);

        VoiceChatRequestDto turn1Request = new VoiceChatRequestDto(55, "Which medicines are low in stock?", "en", true);
        ResponseEntity<ApiResponse<ChatReplyDto>> turn1Response = voiceController.processVoiceChat(turn1Request);

        assertEquals(HttpStatus.OK, turn1Response.getStatusCode());
        assertNotNull(turn1Response.getBody());
        assertEquals("query_low_stock_medicines", turn1Response.getBody().getData().getToolUsed());
        assertEquals(55, turn1Response.getBody().getData().getSessionId());

        // Turn 2: "What about their suppliers?" with same session ID 55
        ChatReplyDto turn2Reply = new ChatReplyDto(
                55,
                "For Paracetamol and Amoxicillin, the matching wholesale supplier is MedSource Global with active contracts.",
                "OLLAMA_LOCAL",
                "query_supplier_summary",
                null
        );
        when(chatOrchestratorService.handleUserMessage(eq(55), eq("What about their suppliers?"), eq(2)))
                .thenReturn(turn2Reply);

        VoiceChatRequestDto turn2Request = new VoiceChatRequestDto(55, "What about their suppliers?", "en", true);
        ResponseEntity<ApiResponse<ChatReplyDto>> turn2Response = voiceController.processVoiceChat(turn2Request);

        assertEquals(HttpStatus.OK, turn2Response.getStatusCode());
        assertNotNull(turn2Response.getBody());
        assertEquals(55, turn2Response.getBody().getData().getSessionId());
        assertEquals("query_supplier_summary", turn2Response.getBody().getData().getToolUsed());
        assertTrue(turn2Response.getBody().getData().getReply().contains("MedSource Global"));

        verify(chatOrchestratorService, times(1)).handleUserMessage(55, "Which medicines are low in stock?", 2);
        verify(chatOrchestratorService, times(1)).handleUserMessage(55, "What about their suppliers?", 2);
    }

    @Test
    @DisplayName("Voice Understanding: Tanglish input 'Indha maasam edhavadhu medicine expire aagudha?' triggers expiry tool")
    void testTanglishVoiceInquiry() {
        when(currentUserService.getCurrentUserId()).thenReturn(2);

        ChatReplyDto tanglishReply = new ChatReplyDto(
                60,
                "Indha maasam 3 medicine batches expire aagudhu (Batch B-201, B-204).",
                "OLLAMA_LOCAL",
                "query_expiring_batches",
                null
        );
        when(chatOrchestratorService.handleUserMessage(eq(60), eq("Indha maasam edhavadhu medicine expire aagudha?"), eq(2)))
                .thenReturn(tanglishReply);

        VoiceChatRequestDto request = new VoiceChatRequestDto(60, "Indha maasam edhavadhu medicine expire aagudha?", "ta", true);
        ResponseEntity<ApiResponse<ChatReplyDto>> response = voiceController.processVoiceChat(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("query_expiring_batches", response.getBody().getData().getToolUsed());
    }

    @Test
    @DisplayName("Voice Understanding: Hindi input 'Kaunsi dawai reorder karni hai?' triggers low stock tool")
    void testHindiVoiceInquiry() {
        when(currentUserService.getCurrentUserId()).thenReturn(2);

        ChatReplyDto hindiReply = new ChatReplyDto(
                70,
                "Abhi 8 dawaiyan reorder level se kam hain, jinme Paracetamol shamil hai.",
                "OLLAMA_LOCAL",
                "query_low_stock_medicines",
                null
        );
        when(chatOrchestratorService.handleUserMessage(eq(70), eq("Kaunsi dawai reorder karni hai?"), eq(2)))
                .thenReturn(hindiReply);

        VoiceChatRequestDto request = new VoiceChatRequestDto(70, "Kaunsi dawai reorder karni hai?", "hi", true);
        ResponseEntity<ApiResponse<ChatReplyDto>> response = voiceController.processVoiceChat(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("query_low_stock_medicines", response.getBody().getData().getToolUsed());
    }
}

