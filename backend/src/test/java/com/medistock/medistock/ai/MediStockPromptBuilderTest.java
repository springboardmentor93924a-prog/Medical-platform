package com.medistock.medistock.ai;

import com.medistock.medistock.ai.chat.KnowledgeBaseService;
import com.medistock.medistock.ai.chat.MediStockPromptBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MediStockPromptBuilderTest {

    private KnowledgeBaseService knowledgeBaseService;
    private MediStockPromptBuilder promptBuilder;

    @BeforeEach
    void setUp() {
        knowledgeBaseService = new KnowledgeBaseService();
        promptBuilder = new MediStockPromptBuilder(knowledgeBaseService);
    }

    @Test
    @DisplayName("Prompt Builder: Generates dynamic temporal and grounding invariants")
    void testPromptInvariants() {
        String prompt = promptBuilder.buildSystemPrompt("What is our stock position?", "PHARMACIST", "Sarah Chen");

        assertNotNull(prompt);
        assertTrue(prompt.contains("MediStock AI"));
        assertTrue(prompt.toLowerCase().contains("zero fabrication"));
        assertTrue(prompt.contains("Current System Timestamp:"));
        assertTrue(prompt.contains("Active User: Sarah Chen"));
        assertTrue(prompt.contains("Canonical Role: PHARMACIST"));
    }

    @Test
    @DisplayName("Prompt Builder: Includes multilingual guidelines for English, Tamil, Tanglish, and Hindi")
    void testMultilingualGuidelines() {
        String prompt = promptBuilder.buildSystemPrompt("Indha maasam edhavadhu medicine expire aagudha?", "PHARMACIST", "Sarah Chen");

        assertTrue(prompt.contains("MULTILINGUAL & DIALECT FLUENCY"));
        assertTrue(prompt.contains("Tamil (தமிழ்)"));
        assertTrue(prompt.contains("Tanglish"));
        assertTrue(prompt.contains("Hindi (हिन्दी"));
        assertTrue(prompt.contains("Indha maasam edhavadhu medicine expire aagudha?"));
    }

    @Test
    @DisplayName("Prompt Builder: Injects role-specific boundaries for Staff vs Supplier")
    void testRoleSpecificBoundaries() {
        String staffPrompt = promptBuilder.buildSystemPrompt("Show stock", "STAFF", "John Doe");
        assertTrue(staffPrompt.contains("Ward & floor inventory staff"));
        assertTrue(staffPrompt.contains("You do NOT have access to wholesale purchase order financial costs"));

        String supplierPrompt = promptBuilder.buildSystemPrompt("Show orders", "SUPPLIER", "Apex Representative");
        assertTrue(supplierPrompt.contains("External wholesale vendor"));
        assertTrue(supplierPrompt.contains("strictly isolated to your own company's registered profile"));
    }

    @Test
    @DisplayName("Prompt Builder: Injects relevant SOP knowledge chunks into prompt")
    void testRAGInjection() {
        String prompt = promptBuilder.buildSystemPrompt("Explain FEFO protocol for expiring batches", "PHARMACIST", "Sarah Chen");

        assertTrue(prompt.contains("RELEVANT MEDISTOCK OPERATIONAL GUIDELINES"));
        assertTrue(prompt.contains("First Expired, First Out (FEFO) Clinical Protocol"));
        assertTrue(prompt.contains("ACTIVE"));
    }
}
