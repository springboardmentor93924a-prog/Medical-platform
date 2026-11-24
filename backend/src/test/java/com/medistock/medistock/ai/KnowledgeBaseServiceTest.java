package com.medistock.medistock.ai;

import com.medistock.medistock.ai.chat.KnowledgeBaseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class KnowledgeBaseServiceTest {

    private KnowledgeBaseService knowledgeBaseService;

    @BeforeEach
    void setUp() {
        knowledgeBaseService = new KnowledgeBaseService();
    }

    @Test
    @DisplayName("Knowledge Base: Has all core SOP sections initialized")
    void testInitialSnippets() {
        var all = knowledgeBaseService.getAllSnippets();
        assertTrue(all.size() >= 5);
        assertTrue(all.stream().anyMatch(s -> "FEFO_POLICY".equals(s.topic())));
        assertTrue(all.stream().anyMatch(s -> "PURCHASE_WORKFLOW".equals(s.topic())));
        assertTrue(all.stream().anyMatch(s -> "INVENTORY_TERMINOLOGY".equals(s.topic())));
        assertTrue(all.stream().anyMatch(s -> "DEMAND_FORECASTING".equals(s.topic())));
        assertTrue(all.stream().anyMatch(s -> "ROLE_SECURITY".equals(s.topic())));
    }

    @Test
    @DisplayName("RAG Retrieval: Matches FEFO expiry policy for batch rotation questions")
    void testRetrieveFefoKnowledge() {
        List<KnowledgeBaseService.KnowledgeSnippet> results =
                knowledgeBaseService.findRelevantKnowledge("How does FEFO work for expiring medicine batches?");

        assertFalse(results.isEmpty());
        assertEquals("FEFO_POLICY", results.get(0).topic());
        assertTrue((results.get(0).title() + " " + results.get(0).content()).contains("First Expired, First Out"));
    }

    @Test
    @DisplayName("RAG Retrieval: Matches purchase order approval guidelines")
    void testRetrievePurchaseOrderWorkflow() {
        List<KnowledgeBaseService.KnowledgeSnippet> results =
                knowledgeBaseService.findRelevantKnowledge("Who is authorized to approve pending purchase orders?");

        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(s -> "PURCHASE_WORKFLOW".equals(s.topic())));
        assertTrue(results.stream().filter(s -> "PURCHASE_WORKFLOW".equals(s.topic())).findFirst().get().content().contains("PENDING_APPROVAL"));
    }

    @Test
    @DisplayName("RAG Retrieval: Matches demand velocity and ROP guidelines")
    void testRetrieveDemandForecastWorkflow() {
        List<KnowledgeBaseService.KnowledgeSnippet> results =
                knowledgeBaseService.findRelevantKnowledge("How is the reorder point and average daily usage calculated?");

        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(s -> "DEMAND_FORECASTING".equals(s.topic())));
        assertTrue(results.stream().filter(s -> "DEMAND_FORECASTING".equals(s.topic())).findFirst().get().content().contains("ROP = ADU * LeadTime + SafetyStock"));
    }

    @Test
    @DisplayName("RAG Retrieval: Graceful on empty or null query")
    void testEmptyQuery() {
        assertTrue(knowledgeBaseService.findRelevantKnowledge(null).isEmpty());
        assertTrue(knowledgeBaseService.findRelevantKnowledge("   ").isEmpty());
    }
}
