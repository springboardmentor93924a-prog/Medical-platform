package com.medistock.medistock.ai;

import com.medistock.medistock.ai.chat.ChatOrchestratorService;
import com.medistock.medistock.ai.chat.LLMProvider;
import com.medistock.medistock.ai.chat.LLMProvider.ChatCompletionResult;
import com.medistock.medistock.ai.chat.LLMProviderFactory;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.entity.AIChatMessage;
import com.medistock.medistock.ai.entity.AIChatSession;
import com.medistock.medistock.ai.repository.AIChatMessageRepository;
import com.medistock.medistock.ai.repository.AIChatSessionRepository;
import com.medistock.medistock.ai.tools.ChatToolRegistry;
import com.medistock.medistock.ai.tools.ChatToolRegistry.ToolExecutionResult;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.service.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ChatOrchestratorServiceTest {

    private AIChatSessionRepository sessionRepository;
    private AIChatMessageRepository messageRepository;
    private ChatToolRegistry toolRegistry;
    private LLMProviderFactory providerFactory;
    private MedicineRepository medicineRepository;
    private CurrentUserService currentUserService;
    private ChatOrchestratorService chatService;

    @BeforeEach
    void setUp() {
        sessionRepository = mock(AIChatSessionRepository.class);
        messageRepository = mock(AIChatMessageRepository.class);
        toolRegistry = mock(ChatToolRegistry.class);
        providerFactory = mock(LLMProviderFactory.class);
        medicineRepository = mock(MedicineRepository.class);
        currentUserService = mock(CurrentUserService.class);
        when(currentUserService.getCurrentUserId()).thenReturn(1);
        when(currentUserService.getCurrentUserRole()).thenReturn("ADMIN");

        chatService = new ChatOrchestratorService(
                sessionRepository,
                messageRepository,
                toolRegistry,
                providerFactory,
                medicineRepository,
                currentUserService
        );
    }

    @Test
    @DisplayName("Session Ownership: Throws SecurityException if user does not own the session")
    void testSessionOwnershipSecurity() {
        AIChatSession foreignSession = new AIChatSession(99, "Other user's session");
        foreignSession.setId(5);
        when(sessionRepository.findById(5)).thenReturn(Optional.of(foreignSession));

        assertThrows(SecurityException.class, () -> chatService.getSessionMessages(5, 1));
        assertThrows(SecurityException.class, () -> chatService.deleteSession(5, 1));
        assertThrows(SecurityException.class, () -> chatService.handleUserMessage(5, "Hello", 1));
    }

    @Test
    @DisplayName("Deterministic Pharmacy Intent: Handles expiring batches inquiry and executes tool")
    void testExpiringBatchesIntent() {
        AIChatSession session = new AIChatSession(1, "Expiry Query");
        session.setId(10);
        when(sessionRepository.save(any(AIChatSession.class))).thenReturn(session);
        when(sessionRepository.findById(10)).thenReturn(Optional.of(session));
        when(providerFactory.hasAnyLiveProvider()).thenReturn(false);

        when(toolRegistry.executeTool(eq("query_expiring_batches"), anyMap(), eq(1)))
                .thenReturn(new ToolExecutionResult("query_expiring_batches", true, List.of(Map.of("batchNumber", "B101")), null));

        ChatReplyDto reply = chatService.handleUserMessage(10, "Which medicines expire in 30 days?", 1);

        assertNotNull(reply);
        assertEquals(10, reply.getSessionId());
        assertEquals("INTERNAL_PHARMACY_ENGINE", reply.getProvider());
        assertEquals("query_expiring_batches", reply.getToolUsed());
        assertNotNull(reply.getToolData());
        assertTrue(reply.getReply().contains("batch expiry report"));

        // Provenance verification
        assertNotNull(reply.getProvenance());
        assertTrue(reply.getProvenance().isVerified());
        assertEquals("MariaDB Live Inventory (Port 3307)", reply.getProvenance().getGroundingSource());
        assertTrue(reply.getProvenance().getToolsInvoked().contains("query_expiring_batches"));
        assertEquals(1, reply.getProvenance().getRecordsReferenced());

        verify(messageRepository, times(2)).save(any(AIChatMessage.class));
    }

    @Test
    @DisplayName("Deterministic Pharmacy Intent: Handles low stock inquiry")
    void testLowStockIntent() {
        AIChatSession session = new AIChatSession(1, "Low stock");
        session.setId(11);
        when(sessionRepository.findById(11)).thenReturn(Optional.of(session));
        when(providerFactory.hasAnyLiveProvider()).thenReturn(false);

        when(toolRegistry.executeTool(eq("query_low_stock_medicines"), anyMap(), eq(1)))
                .thenReturn(new ToolExecutionResult("query_low_stock_medicines", true, List.of(Map.of("medicineName", "Amoxicillin")), null));

        ChatReplyDto reply = chatService.handleUserMessage(11, "Show all low stock medicines", 1);

        assertNotNull(reply);
        assertEquals("query_low_stock_medicines", reply.getToolUsed());
        assertTrue(reply.getReply().contains("minimum stock alert"));
        assertNotNull(reply.getProvenance());
        assertTrue(reply.getProvenance().isVerified());
    }

    @Test
    @DisplayName("Multi-Step Orchestration: Chains multiple tools before synthesizing grounded answer")
    void testMultiStepToolChaining() {
        AIChatSession session = new AIChatSession(1, "Multi Step Query");
        session.setId(12);
        when(sessionRepository.findById(12)).thenReturn(Optional.of(session));

        LLMProvider mockProvider = mock(LLMProvider.class);
        when(mockProvider.getProviderName()).thenReturn("MOCK_OPENAI");
        when(providerFactory.hasAnyLiveProvider()).thenReturn(true);
        when(providerFactory.getActiveProvider()).thenReturn(mockProvider);

        // Step 1: LLM calls query_low_stock_medicines
        // Step 2: LLM calls query_purchase_price_trends for medicineId 1
        // Step 3: LLM provides synthesis
        when(mockProvider.generateResponse(anyList(), anyList()))
                .thenReturn(ChatCompletionResult.toolCall("query_low_stock_medicines", Map.of(), "MOCK_OPENAI"))
                .thenReturn(ChatCompletionResult.toolCall("query_purchase_price_trends", Map.of("medicineId", 1), "MOCK_OPENAI"))
                .thenReturn(ChatCompletionResult.text("Amoxicillin is critically low. Historical purchase unit cost was $4.20 from Apex Medical.", "MOCK_OPENAI"));

        when(toolRegistry.executeTool(eq("query_low_stock_medicines"), anyMap(), eq(1)))
                .thenReturn(new ToolExecutionResult("query_low_stock_medicines", true, List.of(Map.of("medicineId", 1, "medicineName", "Amoxicillin")), null));
        when(toolRegistry.executeTool(eq("query_purchase_price_trends"), anyMap(), eq(1)))
                .thenReturn(new ToolExecutionResult("query_purchase_price_trends", true, List.of(Map.of("unitCost", 4.20, "supplier", "Apex Medical")), null));

        ChatReplyDto reply = chatService.handleUserMessage(12, "Which medicines are low and what was their last purchase price?", 1);

        assertNotNull(reply);
        assertEquals("MOCK_OPENAI", reply.getProvider());
        assertTrue(reply.getReply().contains("Historical purchase unit cost was $4.20"));

        assertNotNull(reply.getProvenance());
        assertTrue(reply.getProvenance().isVerified());
        assertEquals("MariaDB Live Inventory (Port 3307)", reply.getProvenance().getGroundingSource());
        assertEquals(2, reply.getProvenance().getToolsInvoked().size());
        assertTrue(reply.getProvenance().getToolsInvoked().contains("query_low_stock_medicines"));
        assertTrue(reply.getProvenance().getToolsInvoked().contains("query_purchase_price_trends"));
        assertEquals(2, reply.getProvenance().getRecordsReferenced());
    }

    @Test
    @DisplayName("Provenance Envelope: Unverified knowledge query produces correct grounding source")
    void testNoToolGroundingProvenance() {
        AIChatSession session = new AIChatSession(1, "Greeting");
        session.setId(13);
        when(sessionRepository.findById(13)).thenReturn(Optional.of(session));
        when(providerFactory.hasAnyLiveProvider()).thenReturn(false);

        ChatReplyDto reply = chatService.handleUserMessage(13, "Hello, how can you help me?", 1);

        assertNotNull(reply);
        assertNotNull(reply.getProvenance());
        assertFalse(reply.getProvenance().isVerified());
        assertEquals("MediStock Clinical Knowledge Base", reply.getProvenance().getGroundingSource());
        assertTrue(reply.getProvenance().getToolsInvoked().isEmpty());
        assertEquals(0, reply.getProvenance().getRecordsReferenced());
    }

    @Test
    @DisplayName("Staff Role Scoping: Staff member can query assigned tasks")
    void testStaffInquiryPermitsTasks() {
        AIChatSession session = new AIChatSession(3, "Staff tasks");
        session.setId(20);
        when(sessionRepository.findById(20)).thenReturn(Optional.of(session));
        when(providerFactory.hasAnyLiveProvider()).thenReturn(false);
        when(currentUserService.getCurrentUserRole()).thenReturn("STAFF");
        when(currentUserService.getCurrentUserId()).thenReturn(3);

        when(toolRegistry.executeTool(eq("query_assigned_tasks"), anyMap(), eq(3)))
                .thenReturn(new ToolExecutionResult("query_assigned_tasks", true, List.of(Map.of("title", "Check fridge temperature")), null));

        ChatReplyDto reply = chatService.handleUserMessage(20, "What tasks are assigned to me today?", 3);

        assertNotNull(reply);
        assertEquals("query_assigned_tasks", reply.getToolUsed());
        assertTrue(reply.getReply().contains("operational floor tasks"));
    }

    @Test
    @DisplayName("Staff Role Scoping: Staff member is strictly denied access to financial loss records")
    void testStaffInquiryDeniesWastageLoss() {
        AIChatSession session = new AIChatSession(3, "Staff loss query");
        session.setId(21);
        when(sessionRepository.findById(21)).thenReturn(Optional.of(session));
        when(providerFactory.hasAnyLiveProvider()).thenReturn(false);
        when(currentUserService.getCurrentUserRole()).thenReturn("STAFF");
        when(currentUserService.getCurrentUserId()).thenReturn(3);

        ChatReplyDto reply = chatService.handleUserMessage(21, "What is our total expired stock financial loss?", 3);

        assertNotNull(reply);
        assertNull(reply.getToolUsed());
        assertTrue(reply.getReply().contains("Access Denied"));
        assertTrue(reply.getReply().contains("STAFF"));
    }

    @Test
    @DisplayName("Supplier Role Scoping: Supplier can query active purchase orders")
    void testSupplierInquiryPermitsPurchaseOrders() {
        AIChatSession session = new AIChatSession(5, "Supplier orders");
        session.setId(30);
        when(sessionRepository.findById(30)).thenReturn(Optional.of(session));
        when(providerFactory.hasAnyLiveProvider()).thenReturn(false);
        when(currentUserService.getCurrentUserRole()).thenReturn("SUPPLIER");
        when(currentUserService.getCurrentUserId()).thenReturn(5);

        when(toolRegistry.executeTool(eq("query_purchase_orders"), anyMap(), eq(5)))
                .thenReturn(new ToolExecutionResult("query_purchase_orders", true, List.of(Map.of("poNumber", "PO-2025-001")), null));

        ChatReplyDto reply = chatService.handleUserMessage(30, "List my active purchase orders", 5);

        assertNotNull(reply);
        assertEquals("query_purchase_orders", reply.getToolUsed());
        assertTrue(reply.getReply().contains("active purchase orders"));
    }

    @Test
    @DisplayName("Supplier Role Scoping: Supplier is strictly denied general hospital medication inventory")
    void testSupplierInquiryDeniesMedicineStock() {
        AIChatSession session = new AIChatSession(5, "Supplier inventory attempt");
        session.setId(31);
        when(sessionRepository.findById(31)).thenReturn(Optional.of(session));
        when(providerFactory.hasAnyLiveProvider()).thenReturn(false);
        when(currentUserService.getCurrentUserRole()).thenReturn("SUPPLIER");
        when(currentUserService.getCurrentUserId()).thenReturn(5);

        Medicine paracetamol = new Medicine();
        paracetamol.setMedicineId(1);
        paracetamol.setMedicineName("Paracetamol 500mg");
        when(medicineRepository.findAll()).thenReturn(List.of(paracetamol));

        ChatReplyDto reply = chatService.handleUserMessage(31, "What is the available stock of Paracetamol?", 5);

        assertNotNull(reply);
        assertNull(reply.getToolUsed());
        assertTrue(reply.getReply().contains("Access Denied"));
        assertTrue(reply.getReply().contains("Wholesale suppliers are authorized to view only their own purchase orders"));
    }
}

