package com.medistock.medistock.ai.chat;

import com.medistock.medistock.ai.dto.ChatMessageDto;
import com.medistock.medistock.ai.dto.ChatProvenanceDto;
import com.medistock.medistock.ai.dto.ChatReplyDto;
import com.medistock.medistock.ai.entity.AIChatMessage;
import com.medistock.medistock.ai.entity.AIChatSession;
import com.medistock.medistock.ai.repository.AIChatMessageRepository;
import com.medistock.medistock.ai.repository.AIChatSessionRepository;
import com.medistock.medistock.ai.tools.ChatToolRegistry;
import com.medistock.medistock.ai.tools.ChatToolRegistry.ToolDefinition;
import com.medistock.medistock.ai.tools.ChatToolRegistry.ToolExecutionResult;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.MedicineRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ChatOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(ChatOrchestratorService.class);

    private final AIChatSessionRepository sessionRepository;
    private final AIChatMessageRepository messageRepository;
    private final ChatToolRegistry toolRegistry;
    private final LLMProviderFactory providerFactory;
    private final MedicineRepository medicineRepository;
    private final CurrentUserService currentUserService;
    private final MediStockPromptBuilder promptBuilder;

    @org.springframework.beans.factory.annotation.Autowired
    public ChatOrchestratorService(
            AIChatSessionRepository sessionRepository,
            AIChatMessageRepository messageRepository,
            ChatToolRegistry toolRegistry,
            LLMProviderFactory providerFactory,
            MedicineRepository medicineRepository,
            CurrentUserService currentUserService,
            MediStockPromptBuilder promptBuilder) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.toolRegistry = toolRegistry;
        this.providerFactory = providerFactory;
        this.medicineRepository = medicineRepository;
        this.currentUserService = currentUserService;
        this.promptBuilder = promptBuilder;
    }

    public ChatOrchestratorService(
            AIChatSessionRepository sessionRepository,
            AIChatMessageRepository messageRepository,
            ChatToolRegistry toolRegistry,
            LLMProviderFactory providerFactory,
            MedicineRepository medicineRepository,
            CurrentUserService currentUserService) {
        this(sessionRepository, messageRepository, toolRegistry, providerFactory, medicineRepository, currentUserService, null);
    }

    public ChatOrchestratorService(
            AIChatSessionRepository sessionRepository,
            AIChatMessageRepository messageRepository,
            ChatToolRegistry toolRegistry,
            LLMProviderFactory providerFactory,
            MedicineRepository medicineRepository) {
        this(sessionRepository, messageRepository, toolRegistry, providerFactory, medicineRepository, null, null);
    }

    /**
     * Creates a new chat session for the user.
     */
    @Transactional
    public AIChatSession createSession(Integer userId, String initialTitle) {
        String title = (initialTitle != null && !initialTitle.isBlank()) ? initialTitle : "Pharmacy Assistant Session";
        AIChatSession session = new AIChatSession(userId, title);
        return sessionRepository.save(session);
    }

    /**
     * Lists all sessions owned by the user.
     */
    @Transactional(readOnly = true)
    public List<AIChatSession> getUserSessions(Integer userId) {
        return sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    /**
     * Retrieves all messages for a session with ownership verification.
     */
    @Transactional(readOnly = true)
    public List<AIChatMessage> getSessionMessages(Integer sessionId, Integer userId) {
        AIChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Chat session not found with ID: " + sessionId));

        if (!Objects.equals(session.getUserId(), userId)) {
            throw new SecurityException("Access denied: You do not own this chat session.");
        }

        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    /**
     * Deletes a session and its message history with ownership verification.
     */
    @Transactional
    public void deleteSession(Integer sessionId, Integer userId) {
        AIChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Chat session not found with ID: " + sessionId));

        if (!Objects.equals(session.getUserId(), userId)) {
            throw new SecurityException("Access denied: You do not own this chat session.");
        }

        sessionRepository.delete(session);
    }

    /**
     * Main conversation orchestrator loop:
     * 1. Loads or initializes session.
     * 2. Assembles recent message history.
     * 3. Dispatches to live LLM or pharmacy rule engine with tool calling.
     * 4. Persists interaction and returns structured reply.
     */
    @Transactional
    public ChatReplyDto handleUserMessage(Integer sessionId, String userPrompt, Integer userId) {
        if (userPrompt == null || userPrompt.isBlank()) {
            throw new IllegalArgumentException("User message cannot be empty.");
        }

        AIChatSession session;
        if (sessionId != null && sessionId > 0) {
            session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new NoSuchElementException("Session not found with ID: " + sessionId));
            if (!Objects.equals(session.getUserId(), userId)) {
                throw new SecurityException("Access denied: You do not own this chat session.");
            }
        } else {
            String title = userPrompt.length() > 40 ? userPrompt.substring(0, 37) + "..." : userPrompt;
            session = createSession(userId, title);
        }

        // Persist User Message
        AIChatMessage userMsgEntity = new AIChatMessage(session.getId(), "USER", userPrompt, "USER");
        messageRepository.save(userMsgEntity);

        // Load conversation context (last 10 messages)
        List<AIChatMessage> recentLogs = messageRepository.findTop10BySessionIdOrderByCreatedAtDesc(session.getId());
        List<AIChatMessage> contextAsc = new ArrayList<>(recentLogs);
        Collections.reverse(contextAsc);

        // Security: Authenticated Identity and Role validation
        if (currentUserService != null) {
            Integer authUserId = currentUserService.getCurrentUserId();
            if (authUserId != null && !Objects.equals(authUserId, userId)) {
                throw new SecurityException("Identity mismatch: Authenticated user does not match the requested user ID.");
            }
        }
        String userRole = (currentUserService != null && currentUserService.getCurrentUserRole() != null)
                ? currentUserService.getCurrentUserRole()
                : "ADMIN";
        String userFullName = (currentUserService != null)
                ? currentUserService.getCurrentUser().map(User::getFullName).orElse("Authenticated User")
                : "Authenticated User";

        String dynamicSystemPrompt = (promptBuilder != null)
                ? promptBuilder.buildSystemPrompt(userPrompt, userRole, userFullName)
                : "You are MediStock AI, an expert pharmacy inventory and demand intelligence assistant. " +
                  "Answer concisely with exact figures when tools are provided. Never guess medication availability without querying tools.";

        List<ChatMessageDto> messagesPayload = new ArrayList<>();
        messagesPayload.add(ChatMessageDto.system(dynamicSystemPrompt));

        for (AIChatMessage m : contextAsc) {
            if ("USER".equalsIgnoreCase(m.getSender())) {
                messagesPayload.add(ChatMessageDto.user(m.getMessageText()));
            } else if ("ASSISTANT".equalsIgnoreCase(m.getSender())) {
                messagesPayload.add(ChatMessageDto.assistant(m.getMessageText()));
            }
        }

        LLMProvider activeProvider = providerFactory.getActiveProvider();
        List<ToolDefinition> availableTools = toolRegistry.getAvailableToolsForRole(userRole);

        String assistantReply = null;
        String toolUsed = null;
        Object toolData = null;
        String providerNameUsed;
        List<String> toolsInvoked = new ArrayList<>();
        int totalRecordsReferenced = 0;

        if (providerFactory.hasAnyLiveProvider()) {
            providerNameUsed = activeProvider.getProviderName();
            int step = 0;
            final int MAX_TOOL_STEPS = 3;

            try {
                while (step < MAX_TOOL_STEPS) {
                    LLMProvider.ChatCompletionResult result = activeProvider.generateResponse(messagesPayload, availableTools);

                    if (result != null && result.hasToolCall()) {
                        String currentTool = result.toolCallName();
                        toolsInvoked.add(currentTool);
                        toolUsed = currentTool;

                        ToolExecutionResult execResult = toolRegistry.executeTool(currentTool, result.toolCallArguments(), userId);
                        toolData = execResult.data();
                        totalRecordsReferenced += countRecords(toolData);

                        // Feed the tool call result back into the LLM conversation stream
                        messagesPayload.add(ChatMessageDto.assistant("Executing " + currentTool));
                        messagesPayload.add(ChatMessageDto.tool(currentTool, toolData));

                        step++;
                    } else if (result != null && result.content() != null && !result.content().isBlank()) {
                        assistantReply = result.content();
                        break;
                    } else {
                        break;
                    }
                }

                // If tools were executed but no textual synthesis was generated yet, request final synthesis
                if ((assistantReply == null || assistantReply.isBlank()) && !toolsInvoked.isEmpty()) {
                    LLMProvider.ChatCompletionResult finalResult = activeProvider.generateResponse(messagesPayload, Collections.emptyList());
                    if (finalResult != null && finalResult.content() != null && !finalResult.content().isBlank()) {
                        assistantReply = finalResult.content();
                    } else {
                        assistantReply = "Retrieved inventory intelligence across " + toolsInvoked.size() + " operation(s). See structured data attached.";
                    }
                }
            } catch (SecurityException se) {
                providerNameUsed = "SYSTEM_SECURITY";
                assistantReply = "Access Denied: " + se.getMessage();
            } catch (Exception e) {
                log.warn("Error during LLM multi-step execution: {}", e.getMessage());
            }

            // Fallback to internal pharmacy engine if LLM returned nothing
            if (assistantReply == null || assistantReply.isBlank()) {
                providerNameUsed = "INTERNAL_PHARMACY_ENGINE";
                var fallback = processPharmacyIntent(userPrompt, userId);
                assistantReply = fallback.reply();
                toolUsed = fallback.toolUsed();
                toolData = fallback.toolData();
                if (toolUsed != null) {
                    toolsInvoked = List.of(toolUsed);
                    totalRecordsReferenced = countRecords(toolData);
                }
            }
        } else {
            // Intelligent Rule-Based Pharmacy Assistant fallback (Zero Cloud/Ollama dependency)
            providerNameUsed = "INTERNAL_PHARMACY_ENGINE";
            var fallback = processPharmacyIntent(userPrompt, userId);
            assistantReply = fallback.reply();
            toolUsed = fallback.toolUsed();
            toolData = fallback.toolData();
            if (toolUsed != null) {
                toolsInvoked = List.of(toolUsed);
                totalRecordsReferenced = countRecords(toolData);
            }
        }

        // Build verified provenance envelope
        boolean isVerified = !toolsInvoked.isEmpty();
        String groundingSource = isVerified
                ? "MariaDB Live Inventory (Port 3307)"
                : ("SYSTEM_SECURITY".equals(providerNameUsed) ? "MediStock Security Interceptor" : "MediStock Clinical Knowledge Base");

        ChatProvenanceDto provenance = new ChatProvenanceDto(
                isVerified,
                groundingSource,
                toolsInvoked,
                totalRecordsReferenced
        );

        // Persist Assistant Message
        AIChatMessage assistantMsgEntity = new AIChatMessage(session.getId(), "ASSISTANT", assistantReply, providerNameUsed);
        messageRepository.save(assistantMsgEntity);

        return new ChatReplyDto(session.getId(), assistantReply, providerNameUsed, toolUsed, toolData, provenance);
    }

    private int countRecords(Object data) {
        if (data == null) {
            return 0;
        }
        if (data instanceof Collection<?> col) {
            return col.size();
        }
        if (data instanceof Map<?, ?> map) {
            for (Object val : map.values()) {
                if (val instanceof Collection<?> nestedCol) {
                    return nestedCol.size();
                }
            }
            return 1;
        }
        return 1;
    }

    private record FallbackResult(String reply, String toolUsed, Object toolData) {}

    /**
     * Deterministic clinical pharmacy intent parser for offline environments.
     */
    private FallbackResult processPharmacyIntent(String prompt, Integer userId) {
        String lower = prompt.toLowerCase().trim();
        String userRole = (currentUserService != null && currentUserService.getCurrentUserRole() != null)
                ? currentUserService.getCurrentUserRole()
                : "ADMIN";

        // 1. Wastage & Financial Loss Inquiries
        if (lower.contains("wastage") || lower.contains("loss") || lower.contains("financial") || lower.contains("spoiled") || lower.contains("cost of expired")) {
            if (!Set.of("ADMIN", "PHARMACIST").contains(userRole)) {
                return new FallbackResult("Access Denied: Your role (" + userRole + ") is not authorized to view financial loss and inventory wastage records.", null, null);
            }
            ToolExecutionResult exec = toolRegistry.executeTool("query_wastage_loss", Collections.emptyMap(), userId);
            return new FallbackResult("Here is the total inventory wastage and financial loss analysis from expired and discarded medicine batches.", "query_wastage_loss", exec.data());
        }

        // 2. Expiry & FEFO Inquiries
        if (lower.contains("expir") || lower.contains("shelf life") || lower.contains("fefo") || lower.contains("near expiry")) {
            if (!Set.of("ADMIN", "PHARMACIST").contains(userRole)) {
                return new FallbackResult("Access Denied: Your role (" + userRole + ") is not authorized to view batch expiry management reports.", null, null);
            }
            int days = 30;
            if (lower.contains("7") || lower.contains("week") || lower.contains("critical")) days = 7;
            else if (lower.contains("60")) days = 60;
            else if (lower.contains("90") || lower.contains("quarter")) days = 90;

            ToolExecutionResult exec = toolRegistry.executeTool("query_expiring_batches", Map.of("daysThreshold", days), userId);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> batches = (List<Map<String, Object>>) exec.data();
            int count = (batches != null) ? batches.size() : 0;

            String reply = String.format(
                    "Here is the batch expiry report for the next %d days. Found **%d batches** requiring attention according to FEFO protocols. Prioritize dispensing the earliest-expiring lots first.",
                    days, count
            );
            return new FallbackResult(reply, "query_expiring_batches", exec.data());
        }

        // 3. Low Stock & Shortages
        if (lower.contains("low stock") || lower.contains("low on stock") || lower.contains("running low") || lower.contains("shortage") || lower.contains("out of stock") || lower.contains("reorder")) {
            if (!Set.of("ADMIN", "PHARMACIST").contains(userRole)) {
                return new FallbackResult("Access Denied: Your role (" + userRole + ") is not authorized to view hospital replenishment alert lists.", null, null);
            }
            ToolExecutionResult exec = toolRegistry.executeTool("query_low_stock_medicines", Collections.emptyMap(), userId);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) exec.data();
            int count = (items != null) ? items.size() : 0;

            String reply = String.format(
                    "Identified **%d medicines** currently at or below their minimum stock alert thresholds. Immediate replenishment requisition is recommended to prevent stockouts.",
                    count
            );
            return new FallbackResult(reply, "query_low_stock_medicines", exec.data());
        }

        // 4. Demand Forecast / Consumption Velocity
        if (lower.contains("forecast") || lower.contains("demand") || lower.contains("velocity")) {
            if (!Set.of("ADMIN", "PHARMACIST").contains(userRole)) {
                return new FallbackResult("Access Denied: Your role (" + userRole + ") is not authorized to view demand forecasting and consumption velocity projections.", null, null);
            }
            Integer medId = findMentionedMedicineId(lower);
            if (medId != null) {
                ToolExecutionResult exec = toolRegistry.executeTool("query_demand_forecast", Map.of("medicineId", medId, "horizonDays", 30), userId);
                return new FallbackResult("Here is the 30-day demand forecast and Average Daily Usage (ADU) analysis for your requested medicine.", "query_demand_forecast", exec.data());
            } else {
                return new FallbackResult("Please specify a medicine name or ID (e.g., 'Forecast demand for Paracetamol') to view historical velocity and 30-day projections.", null, null);
            }
        }

        // 5. Suppliers
        if (lower.contains("supplier") || lower.contains("vendor") || lower.contains("lead time")) {
            if ("STAFF".equalsIgnoreCase(userRole)) {
                return new FallbackResult("Access Denied: Staff members are not authorized to view wholesale supplier directory or purchase order summaries.", null, null);
            }
            ToolExecutionResult exec = toolRegistry.executeTool("query_supplier_summary", Collections.emptyMap(), userId);
            return new FallbackResult("Here is the wholesale supplier directory and active purchase order status.", "query_supplier_summary", exec.data());
        }

        // 6. Assigned Tasks & Operational Duties (Staff & Pharmacist)
        if (lower.contains("task") || lower.contains("assignment") || lower.contains("assigned to me") || lower.contains("my task") || lower.contains("floor duty") || lower.contains("to-do")) {
            if ("SUPPLIER".equalsIgnoreCase(userRole)) {
                return new FallbackResult("Access Denied: Wholesale suppliers are not authorized to view internal hospital staff task assignments.", null, null);
            }
            ToolExecutionResult exec = toolRegistry.executeTool("query_assigned_tasks", Collections.emptyMap(), userId);
            return new FallbackResult("Here are your operational floor tasks and pending hospital duties.", "query_assigned_tasks", exec.data());
        }

        // 7. Purchase Orders & Shipments (Supplier & Pharmacist/Admin)
        if (lower.contains("purchase order") || lower.contains("po ") || lower.contains("my order") || lower.contains("orders pending") || lower.contains("shipment") || lower.contains("deliveries")) {
            if ("STAFF".equalsIgnoreCase(userRole)) {
                return new FallbackResult("Access Denied: Staff members are not authorized to view wholesale purchase orders or procurement contracts.", null, null);
            }
            ToolExecutionResult exec = toolRegistry.executeTool("query_purchase_orders", Collections.emptyMap(), userId);
            return new FallbackResult("Here are the active purchase orders and delivery statuses matching your account.", "query_purchase_orders", exec.data());
        }

        // 8. Specific Medicine Stock Lookup
        Integer specificMedId = findMentionedMedicineId(lower);
        if (specificMedId != null) {
            if ("SUPPLIER".equalsIgnoreCase(userRole)) {
                return new FallbackResult("Access Denied: Wholesale suppliers are authorized to view only their own purchase orders, delivery statuses, and contracted products, not general hospital medication inventory.", null, null);
            }
            ToolExecutionResult exec = toolRegistry.executeTool("query_medicine_stock", Map.of("medicineId", specificMedId), userId);
            return new FallbackResult("Here is the current usable stock position and batch availability for the selected medicine.", "query_medicine_stock", exec.data());
        }

        // Role-Aware Default Helpful Guidance
        String generalReply;
        if ("STAFF".equalsIgnoreCase(userRole)) {
            generalReply = "Hello! I am MediStock AI Assistant for Pharmacy Staff. You can ask me about:\n" +
                    "- **Medicine Stock**: 'What is the available stock of Paracetamol?'\n" +
                    "- **Shelf Locations**: 'Where is Amoxicillin located on shelves?'\n" +
                    "- **Assigned Tasks**: 'What tasks are assigned to me today?'\n" +
                    "- **Goods Deliveries**: 'Check recent delivery receipts and goods verification'\n" +
                    "*(Note: Wholesale purchase costs, financial losses, and demand forecasting are restricted to Pharmacists and Admins.)*";
        } else if ("SUPPLIER".equalsIgnoreCase(userRole)) {
            generalReply = "Hello! I am MediStock AI Assistant for Wholesale Suppliers. You can ask me about:\n" +
                    "- **Purchase Orders**: 'List my active purchase orders'\n" +
                    "- **Pending Deliveries**: 'What orders are currently pending delivery?'\n" +
                    "- **Company Profile**: 'Show my supplier company summary'\n" +
                    "- **Delivery Receipts**: 'Check delivery confirmations for my shipments'\n" +
                    "*(Note: Internal hospital inventory and other supplier accounts are strictly isolated.)*";
        } else {
            generalReply = "Hello! I am MediStock AI Assistant. You can ask me about:\n" +
                    "- **Expiring Batches**: 'Which medicines expire in the next 30 days?'\n" +
                    "- **Stock Levels & Shortages**: 'Show low stock medicines'\n" +
                    "- **Demand Forecasting**: 'Forecast demand for Paracetamol'\n" +
                    "- **Inventory Wastage**: 'Show expired medicine loss'\n" +
                    "- **Suppliers & Purchase Orders**: 'List active suppliers and pending orders'";
        }
        return new FallbackResult(generalReply, null, null);
    }

    private Integer findMentionedMedicineId(String text) {
        List<Medicine> all = medicineRepository.findAll();
        for (Medicine m : all) {
            if (m.getMedicineName() != null) {
                String name = m.getMedicineName().toLowerCase();
                if (text.contains(name)) {
                    return m.getMedicineId();
                }
                String firstWord = name.split("\\s+")[0];
                if (firstWord.length() > 3 && text.contains(firstWord)) {
                    return m.getMedicineId();
                }
            }
            if (m.getGenericName() != null) {
                String gen = m.getGenericName().toLowerCase();
                if (text.contains(gen)) {
                    return m.getMedicineId();
                }
                String genFirst = gen.split("\\s+")[0];
                if (genFirst.length() > 3 && text.contains(genFirst)) {
                    return m.getMedicineId();
                }
            }
        }
        // Check if an ID like #1 or id 1 is mentioned
        for (Medicine m : all) {
            if (text.contains("id " + m.getMedicineId()) || text.contains("#" + m.getMedicineId())) {
                return m.getMedicineId();
            }
        }
        return null;
    }
}
