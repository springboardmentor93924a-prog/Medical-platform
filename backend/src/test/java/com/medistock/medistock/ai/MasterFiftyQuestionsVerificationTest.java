package com.medistock.medistock.ai;

import com.medistock.medistock.ai.chat.*;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.entity.AIChatSession;
import com.medistock.medistock.ai.entity.AIToolLog;
import com.medistock.medistock.ai.repository.AIChatMessageRepository;
import com.medistock.medistock.ai.repository.AIChatSessionRepository;
import com.medistock.medistock.ai.repository.AIToolLogRepository;
import com.medistock.medistock.ai.tools.*;
import com.medistock.medistock.ai.tools.ChatToolRegistry.ToolExecutionResult;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.entity.Role;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Master 50-Question Automated Verification Suite")
class MasterFiftyQuestionsVerificationTest {

    private AIChatSessionRepository sessionRepository;
    private AIChatMessageRepository messageRepository;
    private ChatToolRegistry toolRegistry;
    private LLMProviderFactory providerFactory;
    private MedicineRepository medicineRepository;
    private CurrentUserService currentUserService;
    private MediStockPromptBuilder promptBuilder;
    private KnowledgeBaseService knowledgeBaseService;
    private ChatOrchestratorService chatService;

    // Tool Mocks
    private StockQueryTool stockQueryTool;
    private ForecastQueryTool forecastQueryTool;
    private ExpiryQueryTool expiryQueryTool;
    private SupplierQueryTool supplierQueryTool;
    private WastageQueryTool wastageQueryTool;
    private PurchaseOrderQueryTool purchaseOrderQueryTool;
    private ConsumptionAnalyticsTool consumptionAnalyticsTool;
    private TaskQueryTool taskQueryTool;
    private DeliveryQueryTool deliveryQueryTool;
    private UserActivityTool userActivityTool;
    private AIToolLogRepository toolLogRepository;

    @BeforeEach
    void setUp() {
        sessionRepository = mock(AIChatSessionRepository.class);
        messageRepository = mock(AIChatMessageRepository.class);
        providerFactory = mock(LLMProviderFactory.class);
        medicineRepository = mock(MedicineRepository.class);
        currentUserService = mock(CurrentUserService.class);
        toolLogRepository = mock(AIToolLogRepository.class);

        stockQueryTool = mock(StockQueryTool.class);
        forecastQueryTool = mock(ForecastQueryTool.class);
        expiryQueryTool = mock(ExpiryQueryTool.class);
        supplierQueryTool = mock(SupplierQueryTool.class);
        wastageQueryTool = mock(WastageQueryTool.class);
        purchaseOrderQueryTool = mock(PurchaseOrderQueryTool.class);
        consumptionAnalyticsTool = mock(ConsumptionAnalyticsTool.class);
        taskQueryTool = mock(TaskQueryTool.class);
        deliveryQueryTool = mock(DeliveryQueryTool.class);
        userActivityTool = mock(UserActivityTool.class);

        toolRegistry = new ChatToolRegistry(
                stockQueryTool,
                forecastQueryTool,
                expiryQueryTool,
                supplierQueryTool,
                wastageQueryTool,
                purchaseOrderQueryTool,
                consumptionAnalyticsTool,
                taskQueryTool,
                deliveryQueryTool,
                userActivityTool,
                toolLogRepository,
                currentUserService
        );

        knowledgeBaseService = new KnowledgeBaseService();
        promptBuilder = new MediStockPromptBuilder(knowledgeBaseService);

        chatService = new ChatOrchestratorService(
                sessionRepository,
                messageRepository,
                toolRegistry,
                providerFactory,
                medicineRepository,
                currentUserService,
                promptBuilder
        );

        // Standard session stubbing
        when(sessionRepository.findById(anyInt())).thenAnswer(inv -> {
            Integer id = inv.getArgument(0);
            Integer currentId = currentUserService.getCurrentUserId() != null ? currentUserService.getCurrentUserId() : 1;
            AIChatSession s = new AIChatSession(currentId, "Test Session");
            s.setId(id);
            return Optional.of(s);
        });
        when(sessionRepository.save(any(AIChatSession.class))).thenAnswer(inv -> inv.getArgument(0));

        // Default medicine catalog stubbing
        Medicine paracetamol = new Medicine();
        paracetamol.setMedicineId(1);
        paracetamol.setMedicineName("Paracetamol 500mg");
        paracetamol.setGenericName("Acetaminophen");

        Medicine amoxicillin = new Medicine();
        amoxicillin.setMedicineId(2);
        amoxicillin.setMedicineName("Amoxicillin 250mg");
        amoxicillin.setGenericName("Amoxicillin");

        when(medicineRepository.findAll()).thenReturn(List.of(paracetamol, amoxicillin));
        when(medicineRepository.findById(1)).thenReturn(Optional.of(paracetamol));
        when(medicineRepository.findById(2)).thenReturn(Optional.of(amoxicillin));
    }

    private User createMockUser(int id, String email, String roleName) {
        User u = new User();
        u.setUserId(id);
        u.setEmail(email);
        u.setFullName(email.split("@")[0]);
        u.setUsername(email.split("@")[0]);
        Role r = new Role();
        r.setRoleName(roleName);
        u.setRole(r);
        return u;
    }

    private void mockSecurityContext(User user, String role) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn(user.getEmail());
        when(currentUserService.getAuthentication()).thenReturn(auth);
        when(currentUserService.getCurrentUser()).thenReturn(Optional.of(user));
        when(currentUserService.getCurrentUserId()).thenReturn(user.getUserId());
        when(currentUserService.getCurrentUserRole()).thenReturn(role);
        when(currentUserService.hasRole(role)).thenReturn(true);
    }

    // ==========================================
    // 1. ADMIN QUESTIONS (12 Questions)
    // ==========================================
    @Nested
    @DisplayName("Admin Role Verification (12 Questions)")
    class AdminQuestions {

        @BeforeEach
        void setAdminRole() {
            User admin = createMockUser(1, "admin@medistock.com", "Admin");
            mockSecurityContext(admin, "ADMIN");
        }

        @Test
        @DisplayName("Q01 [Admin]: Hospital-wide batch expiry analysis")
        void testQ01ExpiringBatches() {
            when(expiryQueryTool.getExpiringBatches(30)).thenReturn(List.of(Map.of("batchNumber", "B101", "expiryDate", "2026-11-20")));
            ChatReplyDto reply = chatService.handleUserMessage(1, "Show me all medicine batches expiring in the next 30 days", 1);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertEquals("MariaDB Live Inventory (Port 3307)", reply.getProvenance().getGroundingSource());
            assertTrue(reply.getProvenance().getToolsInvoked().contains("query_expiring_batches"));
        }

        @Test
        @DisplayName("Q02 [Admin]: Critical low stock alerts & shortage risks")
        void testQ02LowStockMedicines() {
            when(stockQueryTool.getLowStockMedicines()).thenReturn(List.of(Map.of("medicineName", "Amoxicillin", "currentStock", 12)));
            ChatReplyDto reply = chatService.handleUserMessage(1, "Which medications are running low on stock?", 1);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertTrue(reply.getProvenance().getToolsInvoked().contains("query_low_stock_medicines"));
        }

        @Test
        @DisplayName("Q03 [Admin]: Total financial loss from expired batches")
        void testQ03FinancialLoss() {
            when(wastageQueryTool.getExpiredLossSummary()).thenReturn(Map.of("totalFinancialLoss", 1450.50, "totalExpiredUnits", 120));
            ChatReplyDto reply = chatService.handleUserMessage(1, "What is our total financial loss from expired medicines?", 1);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertTrue(reply.getProvenance().getToolsInvoked().contains("query_wastage_loss"));
        }

        @Test
        @DisplayName("Q04 [Admin]: 30-day demand forecast for Paracetamol")
        void testQ04DemandForecast() {
            when(forecastQueryTool.getDemandForecast(1, 30)).thenReturn(Map.of("predictedDemandUnits", 300, "averageDailyUsage", 10.0));
            ChatReplyDto reply = chatService.handleUserMessage(1, "Forecast demand for Paracetamol for the next 30 days", 1);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertTrue(reply.getProvenance().getToolsInvoked().contains("query_demand_forecast"));
        }

        @Test
        @DisplayName("Q05 [Admin]: Wholesale supplier directory & lead times")
        void testQ05SupplierDirectory() {
            when(supplierQueryTool.getSupplierSummary()).thenReturn(List.of(Map.of("supplierName", "Apex Medical", "activePurchaseOrders", 2)));
            ChatReplyDto reply = chatService.handleUserMessage(1, "Show all registered suppliers and their active purchase orders", 1);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertTrue(reply.getProvenance().getToolsInvoked().contains("query_supplier_summary"));
        }

        @Test
        @DisplayName("Q06 [Admin]: Specific medicine stock and batch lots")
        void testQ06MedicineStock() {
            when(stockQueryTool.getMedicineStock(1)).thenReturn(Map.of("totalUsableStock", 450, "reorderPoint", 120));
            ChatReplyDto reply = chatService.handleUserMessage(1, "Check usable stock position for Paracetamol", 1);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertTrue(reply.getProvenance().getToolsInvoked().contains("query_medicine_stock"));
        }

        @Test
        @DisplayName("Q07 [Admin]: Purchase order listing across suppliers")
        void testQ07PurchaseOrders() {
            when(purchaseOrderQueryTool.getPurchaseOrders("PENDING_APPROVAL", 20)).thenReturn(List.of(Map.of("poId", 101, "totalCost", 5000.00)));
            ToolExecutionResult res = toolRegistry.executeTool("query_purchase_orders", Map.of("status", "PENDING_APPROVAL"), 1);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q08 [Admin]: Pending PO approvals requiring Admin signature")
        void testQ08PendingApprovals() {
            when(purchaseOrderQueryTool.getPendingApprovals()).thenReturn(Map.of("pendingApprovalCount", 1, "pendingOrders", List.of(Map.of("poId", 102, "supplierName", "Apex Medical"))));
            ToolExecutionResult res = toolRegistry.executeTool("query_pending_approvals", Collections.emptyMap(), 1);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q09 [Admin]: Delivery receiving history & discrepancies")
        void testQ09DeliveryHistory() {
            when(deliveryQueryTool.getDeliveryHistory(null)).thenReturn(List.of(Map.of("grnId", 1, "receivedQuantity", 500)));
            ToolExecutionResult res = toolRegistry.executeTool("query_delivery_history", Collections.emptyMap(), 1);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q10 [Admin]: Hospital-wide inventory analytics & valuation")
        void testQ10InventoryAnalytics() {
            when(consumptionAnalyticsTool.getInventoryAnalytics()).thenReturn(Map.of("totalBatches", 85, "healthyBatches", 70));
            ToolExecutionResult res = toolRegistry.executeTool("query_inventory_analytics", Collections.emptyMap(), 1);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q11 [Admin]: Historical unit purchase cost trends")
        void testQ11PriceTrends() {
            when(consumptionAnalyticsTool.getPurchasePriceTrends(1)).thenReturn(Map.of("medicineId", 1, "averageHistoricalUnitCost", 4.25));
            ToolExecutionResult res = toolRegistry.executeTool("query_purchase_price_trends", Map.of("medicineId", 1), 1);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q12 [Admin]: User activity audit logs")
        void testQ12UserActivityLogs() {
            when(userActivityTool.getUserActivity(null, null, 20)).thenReturn(List.of(Map.of("action", "LOGIN", "username", "admin")));
            ToolExecutionResult res = toolRegistry.executeTool("query_user_activity", Collections.emptyMap(), 1);
            assertTrue(res.success());
        }
    }

    // ==========================================
    // 2. PHARMACIST QUESTIONS (12 Questions)
    // ==========================================
    @Nested
    @DisplayName("Pharmacist Role Verification (12 Questions)")
    class PharmacistQuestions {

        @BeforeEach
        void setPharmacistRole() {
            User pharmacist = createMockUser(2, "pharmacist@medistock.com", "Pharmacist");
            mockSecurityContext(pharmacist, "PHARMACIST");
        }

        @Test
        @DisplayName("Q13 [Pharmacist]: Expiry check in English")
        void testQ13ExpiryEnglish() {
            when(expiryQueryTool.getExpiringBatches(30)).thenReturn(List.of(Map.of("batchNumber", "B102")));
            ChatReplyDto reply = chatService.handleUserMessage(2, "Which medicines will expire within 30 days?", 2);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertTrue(reply.getProvenance().getToolsInvoked().contains("query_expiring_batches"));
        }

        @Test
        @DisplayName("Q14 [Pharmacist]: Expiry check in Tamil (தமிழ்)")
        void testQ14ExpiryTamil() {
            String tamilPrompt = "இம்மாதம் காலாவதியாகும் மருந்துகள் எவை?";
            String prompt = promptBuilder.buildSystemPrompt(tamilPrompt, "PHARMACIST", "Sarah Chen");
            assertTrue(prompt.contains("Tamil (தமிழ்)"));
        }

        @Test
        @DisplayName("Q15 [Pharmacist]: Expiry check in Tanglish")
        void testQ15ExpiryTanglish() {
            String tanglishPrompt = "Indha maasam edhavadhu medicine expire aagudha?";
            String prompt = promptBuilder.buildSystemPrompt(tanglishPrompt, "PHARMACIST", "Sarah Chen");
            assertTrue(prompt.contains("Tanglish"));
        }

        @Test
        @DisplayName("Q16 [Pharmacist]: Stock inquiry in Hindi (हिन्दी)")
        void testQ16StockHindi() {
            String hindiPrompt = "Paracetamol ka kitna stock bacha hai?";
            String prompt = promptBuilder.buildSystemPrompt(hindiPrompt, "PHARMACIST", "Sarah Chen");
            assertTrue(prompt.contains("Hindi (हिन्दी"));
        }

        @Test
        @DisplayName("Q17 [Pharmacist]: Low stock replenishment alerts")
        void testQ17LowStockReplenishment() {
            when(stockQueryTool.getLowStockMedicines()).thenReturn(List.of(Map.of("medicineName", "Paracetamol", "reorderUrgency", "CRITICAL_SHORTAGE")));
            ChatReplyDto reply = chatService.handleUserMessage(2, "Show low stock medicines requiring replenishment", 2);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
        }

        @Test
        @DisplayName("Q18 [Pharmacist]: Demand velocity explanation from SOP")
        void testQ18DemandVelocitySOP() {
            var snippets = knowledgeBaseService.findRelevantKnowledge("How is average daily usage and ROP calculated?");
            assertFalse(snippets.isEmpty());
            assertTrue(snippets.stream().anyMatch(s -> s.content().contains("ROP = ADU * LeadTime + SafetyStock")));
        }

        @Test
        @DisplayName("Q19 [Pharmacist]: Supplier contact info")
        void testQ19SupplierContact() {
            when(supplierQueryTool.getSupplierSummary()).thenReturn(List.of(Map.of("supplierName", "Apex Medical", "phone", "555-0199")));
            ToolExecutionResult res = toolRegistry.executeTool("query_supplier_summary", Collections.emptyMap(), 2);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q20 [Pharmacist]: Historical consumption over 30 days")
        void testQ20ConsumptionHistory() {
            when(consumptionAnalyticsTool.getConsumptionHistory(1, 30)).thenReturn(Map.of("totalUnitsDispensed", 180, "averageDailyUsage", 6.0));
            ToolExecutionResult res = toolRegistry.executeTool("query_consumption_history", Map.of("medicineId", 1, "days", 30), 2);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q21 [Pharmacist]: Purchase price comparison")
        void testQ21PriceComparison() {
            when(consumptionAnalyticsTool.getPurchasePriceTrends(2)).thenReturn(Map.of("medicineName", "Amoxicillin", "averageHistoricalUnitCost", 3.80));
            ToolExecutionResult res = toolRegistry.executeTool("query_purchase_price_trends", Map.of("medicineId", 2), 2);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q22 [Pharmacist]: View pending PO approvals (Permitted read-only)")
        void testQ22PendingApprovalsPermitted() {
            when(purchaseOrderQueryTool.getPendingApprovals()).thenReturn(Map.of("pendingApprovalCount", 1, "pendingOrders", List.of(Map.of("poId", 103))));
            ToolExecutionResult res = toolRegistry.executeTool("query_pending_approvals", Collections.emptyMap(), 2);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q23 [Pharmacist]: Discrepancy checks in deliveries")
        void testQ23DeliveryDiscrepancies() {
            when(deliveryQueryTool.getDeliveryHistory(null)).thenReturn(List.of(Map.of("hasDiscrepancy", true)));
            ToolExecutionResult res = toolRegistry.executeTool("query_delivery_history", Collections.emptyMap(), 2);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q24 [Pharmacist]: Blocked from accessing Admin User Activity Logs (Security Alert)")
        void testQ24BlockedUserActivityLogs() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_user_activity", Collections.emptyMap(), 2));
        }
    }

    // ==========================================
    // 3. STAFF QUESTIONS (12 Questions)
    // ==========================================
    @Nested
    @DisplayName("Staff Role Verification (12 Questions)")
    class StaffQuestions {

        @BeforeEach
        void setStaffRole() {
            User staff = createMockUser(3, "staff@medistock.com", "Staff");
            mockSecurityContext(staff, "STAFF");
        }

        @Test
        @DisplayName("Q25 [Staff]: Check medicine stock availability in English")
        void testQ25StockEnglish() {
            when(stockQueryTool.getMedicineStock(1)).thenReturn(Map.of("totalUsableStock", 150));
            ToolExecutionResult res = toolRegistry.executeTool("query_medicine_stock", Map.of("medicineId", 1), 3);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q26 [Staff]: Check stock availability in Tanglish")
        void testQ26StockTanglish() {
            String tanglishPrompt = "Amoxicillin stock evalo irukku?";
            String prompt = promptBuilder.buildSystemPrompt(tanglishPrompt, "STAFF", "John Doe");
            assertTrue(prompt.contains("Tanglish"));
            assertTrue(prompt.contains("John Doe"));
        }

        @Test
        @DisplayName("Q27 [Staff]: Check assigned inventory tasks (Isolated to user ID 3)")
        void testQ27AssignedTasks() {
            when(taskQueryTool.getAssignedTasks(null, null)).thenReturn(List.of(Map.of("taskId", 1, "taskName", "Restock Ward A")));
            ToolExecutionResult res = toolRegistry.executeTool("query_assigned_tasks", Collections.emptyMap(), 3);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q28 [Staff]: Check delivery receiving history")
        void testQ28DeliveryReceiving() {
            when(deliveryQueryTool.getDeliveryHistory(null)).thenReturn(List.of(Map.of("grnNumber", "GRN-001")));
            ToolExecutionResult res = toolRegistry.executeTool("query_delivery_history", Collections.emptyMap(), 3);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q29 [Staff]: FEFO picking protocol question")
        void testQ29FefoProtocol() {
            var snippets = knowledgeBaseService.findRelevantKnowledge("Which batch should I dispense first?");
            assertFalse(snippets.isEmpty());
            assertEquals("FEFO_POLICY", snippets.get(0).topic());
        }

        @Test
        @DisplayName("Q30 [Staff]: Lot status explanation from SOP")
        void testQ30LotStatusSOP() {
            var snippets = knowledgeBaseService.findRelevantKnowledge("What does QUARANTINED batch status mean?");
            assertFalse(snippets.isEmpty());
            assertTrue(snippets.stream().anyMatch(s -> s.content().contains("QUARANTINED")));
        }

        @Test
        @DisplayName("Q31 [Staff]: Blocked from viewing financial loss (Security Alert)")
        void testQ31BlockedFinancialLoss() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_wastage_loss", Collections.emptyMap(), 3));
        }

        @Test
        @DisplayName("Q32 [Staff]: Blocked from wholesale supplier directory (Security Alert)")
        void testQ32BlockedSupplierDirectory() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_supplier_summary", Collections.emptyMap(), 3));
        }

        @Test
        @DisplayName("Q33 [Staff]: Blocked from purchase orders list (Security Alert)")
        void testQ33BlockedPurchaseOrders() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_purchase_orders", Collections.emptyMap(), 3));
        }

        @Test
        @DisplayName("Q34 [Staff]: Blocked from demand forecasting calculations (Security Alert)")
        void testQ34BlockedDemandForecasting() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_demand_forecast", Map.of("medicineId", 1), 3));
        }

        @Test
        @DisplayName("Q35 [Staff]: Blocked from user audit logs (Security Alert)")
        void testQ35BlockedUserAuditLogs() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_user_activity", Collections.emptyMap(), 3));
        }

        @Test
        @DisplayName("Q36 [Staff]: General hospital pharmacy greeting")
        void testQ36GeneralGreeting() {
            ChatReplyDto reply = chatService.handleUserMessage(1, "Hi, what can I ask you?", 3);
            assertNotNull(reply);
            assertFalse(reply.getProvenance().isVerified());
            assertEquals("MediStock Clinical Knowledge Base", reply.getProvenance().getGroundingSource());
        }
    }

    // ==========================================
    // 4. SUPPLIER QUESTIONS (10 Questions)
    // ==========================================
    @Nested
    @DisplayName("Supplier Role Verification (10 Questions)")
    class SupplierQuestions {

        @BeforeEach
        void setSupplierRole() {
            User supplierUser = createMockUser(4, "supplier@medistock.com", "Supplier");
            mockSecurityContext(supplierUser, "SUPPLIER");

            Supplier mySupplier = new Supplier();
            mySupplier.setSupplierId(11);
            mySupplier.setSupplierName("Apex Medical Supplies Ltd");
            mySupplier.setEmail("supplier@medistock.com");
            when(currentUserService.getSupplierForCurrentUser()).thenReturn(Optional.of(mySupplier));
        }

        @Test
        @DisplayName("Q37 [Supplier]: View own company profile & active PO count")
        void testQ37OwnSupplierProfile() {
            when(supplierQueryTool.getSupplierSummary()).thenReturn(List.of(Map.of("supplierId", 11, "supplierName", "Apex Medical Supplies Ltd")));
            ToolExecutionResult res = toolRegistry.executeTool("query_supplier_summary", Collections.emptyMap(), 4);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q38 [Supplier]: View own purchase orders list")
        void testQ38OwnPurchaseOrders() {
            when(purchaseOrderQueryTool.getPurchaseOrders(null, 20)).thenReturn(List.of(Map.of("poId", 201, "supplierId", 11)));
            ToolExecutionResult res = toolRegistry.executeTool("query_purchase_orders", Collections.emptyMap(), 4);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q39 [Supplier]: View own delivery notes")
        void testQ39OwnDeliveries() {
            when(deliveryQueryTool.getDeliveryHistory(null)).thenReturn(List.of(Map.of("grnId", 1, "supplierId", 11)));
            ToolExecutionResult res = toolRegistry.executeTool("query_delivery_history", Collections.emptyMap(), 4);
            assertTrue(res.success());
        }

        @Test
        @DisplayName("Q40 [Supplier]: Blocked from hospital internal medicine stock (Tenant Isolation)")
        void testQ40BlockedInternalStock() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_medicine_stock", Map.of("medicineId", 1), 4));
        }

        @Test
        @DisplayName("Q41 [Supplier]: Blocked from hospital clinical batch expiries (Tenant Isolation)")
        void testQ41BlockedBatchExpiries() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_expiring_batches", Map.of("daysThreshold", 30), 4));
        }

        @Test
        @DisplayName("Q42 [Supplier]: Blocked from hospital financial loss (Tenant Isolation)")
        void testQ42BlockedFinancialLoss() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_wastage_loss", Collections.emptyMap(), 4));
        }

        @Test
        @DisplayName("Q43 [Supplier]: Blocked from staff assigned tasks (Tenant Isolation)")
        void testQ43BlockedStaffTasks() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_assigned_tasks", Collections.emptyMap(), 4));
        }

        @Test
        @DisplayName("Q44 [Supplier]: Blocked from approving purchase orders (Tenant Isolation)")
        void testQ44BlockedPendingApprovals() {
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_pending_approvals", Collections.emptyMap(), 4));
        }

        @Test
        @DisplayName("Q45 [Supplier]: PO approval workflow question from knowledge base")
        void testQ45PoWorkflowSOP() {
            var snippets = knowledgeBaseService.findRelevantKnowledge("How does PO approval work?");
            assertFalse(snippets.isEmpty());
            assertTrue(snippets.stream().anyMatch(s -> "PURCHASE_WORKFLOW".equals(s.topic())));
        }

        @Test
        @DisplayName("Q46 [Supplier]: Blocked if no wholesale account is mapped to user")
        void testQ46UnmappedSupplierAccount() {
            when(supplierQueryTool.getSupplierSummary()).thenThrow(new SecurityException("Access Denied: No active wholesale supplier profile is associated with your authenticated account."));
            assertThrows(SecurityException.class, () -> toolRegistry.executeTool("query_supplier_summary", Collections.emptyMap(), 4));
        }
    }

    // ==========================================
    // 5. MULTI-STEP & BOUNDARY CASES (4 Questions)
    // ==========================================
    @Nested
    @DisplayName("Multi-Step Chaining & Boundary Edge Cases (4 Questions)")
    class MultiStepAndBoundaryCases {

        @Test
        @DisplayName("Q47: Chained Multi-Step Execution (Low stock -> price trends)")
        void testQ47ChainedMultiStep() {
            User pharmacist = createMockUser(2, "pharmacist@medistock.com", "Pharmacist");
            mockSecurityContext(pharmacist, "PHARMACIST");

            LLMProvider mockProvider = mock(LLMProvider.class);
            when(mockProvider.getProviderName()).thenReturn("MOCK_LLM");
            when(providerFactory.hasAnyLiveProvider()).thenReturn(true);
            when(providerFactory.getActiveProvider()).thenReturn(mockProvider);

            when(mockProvider.generateResponse(anyList(), anyList()))
                    .thenReturn(LLMProvider.ChatCompletionResult.toolCall("query_low_stock_medicines", Map.of(), "MOCK_LLM"))
                    .thenReturn(LLMProvider.ChatCompletionResult.toolCall("query_purchase_price_trends", Map.of("medicineId", 1), "MOCK_LLM"))
                    .thenReturn(LLMProvider.ChatCompletionResult.text("Amoxicillin is low. Last purchase price was $4.20/unit.", "MOCK_LLM"));

            when(stockQueryTool.getLowStockMedicines()).thenReturn(List.of(Map.of("medicineId", 1, "medicineName", "Amoxicillin")));
            when(consumptionAnalyticsTool.getPurchasePriceTrends(1)).thenReturn(Map.of("averageHistoricalUnitCost", 4.20));

            ChatReplyDto reply = chatService.handleUserMessage(1, "Check low stock and compare last purchase cost", 2);
            assertNotNull(reply);
            assertTrue(reply.getProvenance().isVerified());
            assertEquals(2, reply.getProvenance().getToolsInvoked().size());
            assertEquals(2, reply.getProvenance().getRecordsReferenced());
        }

        @Test
        @DisplayName("Q48: Zero-Inventory Medicine Stock Truthfulness")
        void testQ48ZeroInventoryTruthfulness() {
            User pharmacist = createMockUser(2, "pharmacist@medistock.com", "Pharmacist");
            mockSecurityContext(pharmacist, "PHARMACIST");
            when(stockQueryTool.getMedicineStock(1)).thenReturn(Map.of("totalUsableStock", 0, "status", "DEPLETED"));

            ToolExecutionResult res = toolRegistry.executeTool("query_medicine_stock", Map.of("medicineId", 1), 2);
            assertTrue(res.success());
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) res.data();
            assertEquals(0, data.get("totalUsableStock"));
        }

        @Test
        @DisplayName("Q49: Empty/Whitespace Prompt Rejection")
        void testQ49EmptyPromptValidation() {
            User admin = createMockUser(1, "admin@medistock.com", "Admin");
            mockSecurityContext(admin, "ADMIN");
            assertThrows(IllegalArgumentException.class, () -> chatService.handleUserMessage(1, "   ", 1));
        }

        @Test
        @DisplayName("Q50: Session Ownership Isolation Guard")
        void testQ50SessionOwnershipGuard() {
            User admin = createMockUser(1, "admin@medistock.com", "Admin");
            mockSecurityContext(admin, "ADMIN");
            AIChatSession sessionOfOtherUser = new AIChatSession(99, "Other Session");
            sessionOfOtherUser.setId(999);
            when(sessionRepository.findById(999)).thenReturn(Optional.of(sessionOfOtherUser));

            assertThrows(SecurityException.class, () -> chatService.handleUserMessage(999, "Check stock", 1));
        }
    }
}

