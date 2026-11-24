package com.medistock.medistock.ai.tools;

import com.medistock.medistock.ai.entity.AIToolLog;
import com.medistock.medistock.ai.repository.AIToolLogRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ChatToolRegistry {

    private static final Logger log = LoggerFactory.getLogger(ChatToolRegistry.class);

    private final StockQueryTool stockQueryTool;
    private final ForecastQueryTool forecastQueryTool;
    private final ExpiryQueryTool expiryQueryTool;
    private final SupplierQueryTool supplierQueryTool;
    private final WastageQueryTool wastageQueryTool;
    private final PurchaseOrderQueryTool purchaseOrderQueryTool;
    private final ConsumptionAnalyticsTool consumptionAnalyticsTool;
    private final TaskQueryTool taskQueryTool;
    private final DeliveryQueryTool deliveryQueryTool;
    private final UserActivityTool userActivityTool;
    private final AIToolLogRepository toolLogRepository;
    private final CurrentUserService currentUserService;

    public record ToolDefinition(
            String name,
            String description,
            Map<String, Object> parameters,
            Set<String> permittedRoles
    ) {}

    public record ToolExecutionResult(
            String toolName,
            boolean success,
            Object data,
            String errorMessage
    ) {}

    @Autowired
    public ChatToolRegistry(
            StockQueryTool stockQueryTool,
            ForecastQueryTool forecastQueryTool,
            ExpiryQueryTool expiryQueryTool,
            SupplierQueryTool supplierQueryTool,
            WastageQueryTool wastageQueryTool,
            PurchaseOrderQueryTool purchaseOrderQueryTool,
            ConsumptionAnalyticsTool consumptionAnalyticsTool,
            TaskQueryTool taskQueryTool,
            DeliveryQueryTool deliveryQueryTool,
            UserActivityTool userActivityTool,
            AIToolLogRepository toolLogRepository,
            CurrentUserService currentUserService) {
        this.stockQueryTool = stockQueryTool;
        this.forecastQueryTool = forecastQueryTool;
        this.expiryQueryTool = expiryQueryTool;
        this.supplierQueryTool = supplierQueryTool;
        this.wastageQueryTool = wastageQueryTool;
        this.purchaseOrderQueryTool = purchaseOrderQueryTool;
        this.consumptionAnalyticsTool = consumptionAnalyticsTool;
        this.taskQueryTool = taskQueryTool;
        this.deliveryQueryTool = deliveryQueryTool;
        this.userActivityTool = userActivityTool;
        this.toolLogRepository = toolLogRepository;
        this.currentUserService = currentUserService;
    }

    // Overloaded constructor for tests or minimal setups
    public ChatToolRegistry(
            StockQueryTool stockQueryTool,
            ForecastQueryTool forecastQueryTool,
            ExpiryQueryTool expiryQueryTool,
            SupplierQueryTool supplierQueryTool,
            WastageQueryTool wastageQueryTool,
            AIToolLogRepository toolLogRepository,
            CurrentUserService currentUserService) {
        this(stockQueryTool, forecastQueryTool, expiryQueryTool, supplierQueryTool, wastageQueryTool,
                null, null, null, null, null, toolLogRepository, currentUserService);
    }

    public ChatToolRegistry(
            StockQueryTool stockQueryTool,
            ForecastQueryTool forecastQueryTool,
            ExpiryQueryTool expiryQueryTool,
            SupplierQueryTool supplierQueryTool,
            WastageQueryTool wastageQueryTool,
            AIToolLogRepository toolLogRepository) {
        this(stockQueryTool, forecastQueryTool, expiryQueryTool, supplierQueryTool, wastageQueryTool,
                null, null, null, null, null, toolLogRepository, null);
    }

    /**
     * Returns structured definitions for all 14 dynamic inventory tools.
     */
    public List<ToolDefinition> getAvailableTools() {
        List<ToolDefinition> tools = new ArrayList<>();

        tools.add(new ToolDefinition(
                "query_medicine_stock",
                "Retrieves current stock levels, usable batches, and dynamic reorder threshold for a specific medicine ID.",
                Map.of("type", "object", "properties", Map.of("medicineId", Map.of("type", "integer", "description", "The numeric medicine ID")), "required", List.of("medicineId")),
                Set.of("ADMIN", "PHARMACIST", "STAFF")
        ));

        tools.add(new ToolDefinition(
                "query_low_stock_medicines",
                "Retrieves all medicines where usable stock is at or below dynamic reorder thresholds.",
                Map.of("type", "object", "properties", Collections.emptyMap()),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_demand_forecast",
                "Retrieves predicted demand, Average Daily Usage (ADU), and consumption velocity for a medicine over 7, 30, or 90 days.",
                Map.of("type", "object", "properties", Map.of(
                        "medicineId", Map.of("type", "integer", "description", "Numeric medicine ID"),
                        "horizonDays", Map.of("type", "integer", "description", "Forecast horizon (e.g. 7, 30, 90)")
                ), "required", List.of("medicineId")),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_expiring_batches",
                "Retrieves batches nearing expiration within a configurable threshold (7, 30, 60, or 90 days) with FEFO priority.",
                Map.of("type", "object", "properties", Map.of(
                        "daysThreshold", Map.of("type", "integer", "description", "Expiry window in days (7, 30, 60, 90)")
                )),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_supplier_summary",
                "Retrieves wholesale suppliers directory and active purchase orders (tenant-scoped for suppliers).",
                Map.of("type", "object", "properties", Collections.emptyMap()),
                Set.of("ADMIN", "PHARMACIST", "SUPPLIER")
        ));

        tools.add(new ToolDefinition(
                "query_wastage_loss",
                "Retrieves financial loss summary of expired and unusable medicine stock.",
                Map.of("type", "object", "properties", Collections.emptyMap()),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_purchase_orders",
                "Retrieves purchase orders filtered by status or tenant supplier boundaries.",
                Map.of("type", "object", "properties", Map.of(
                        "status", Map.of("type", "string", "description", "Order status: PENDING_APPROVAL, APPROVED, ORDERED, SHIPPED, DELIVERED"),
                        "limit", Map.of("type", "integer", "description", "Maximum orders to return")
                )),
                Set.of("ADMIN", "PHARMACIST", "SUPPLIER")
        ));

        tools.add(new ToolDefinition(
                "query_pending_approvals",
                "Retrieves purchase orders awaiting Admin approval review.",
                Map.of("type", "object", "properties", Collections.emptyMap()),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_consumption_history",
                "Retrieves actual historical dispensing volumes and daily average usage from database stock logs.",
                Map.of("type", "object", "properties", Map.of(
                        "medicineId", Map.of("type", "integer", "description", "Numeric medicine ID"),
                        "days", Map.of("type", "integer", "description", "Historical window in days (e.g. 30, 60, 90)")
                ), "required", List.of("medicineId")),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_inventory_analytics",
                "Computes overall pharmacy inventory health ratio, total SKUs, active batches, and risk metrics.",
                Map.of("type", "object", "properties", Collections.emptyMap()),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_purchase_price_trends",
                "Analyzes unit purchase price trends across historical purchase orders for a medicine.",
                Map.of("type", "object", "properties", Map.of(
                        "medicineId", Map.of("type", "integer", "description", "Numeric medicine ID")
                ), "required", List.of("medicineId")),
                Set.of("ADMIN", "PHARMACIST")
        ));

        tools.add(new ToolDefinition(
                "query_assigned_tasks",
                "Retrieves operational tasks (Staff members view only their own assigned tasks).",
                Map.of("type", "object", "properties", Map.of(
                        "status", Map.of("type", "string", "description", "Task status: PENDING, IN_PROGRESS, COMPLETED"),
                        "priority", Map.of("type", "string", "description", "Task priority: LOW, MEDIUM, HIGH, URGENT")
                )),
                Set.of("ADMIN", "PHARMACIST", "STAFF")
        ));

        tools.add(new ToolDefinition(
                "query_delivery_history",
                "Retrieves goods receipt notes (GRN) and delivery verification history.",
                Map.of("type", "object", "properties", Map.of(
                        "purchaseOrderId", Map.of("type", "integer", "description", "Optional purchase order ID filter")
                )),
                Set.of("ADMIN", "PHARMACIST", "STAFF", "SUPPLIER")
        ));

        tools.add(new ToolDefinition(
                "query_user_activity",
                "Retrieves system security audit trail and user access logs (Admin only).",
                Map.of("type", "object", "properties", Map.of(
                        "targetUserId", Map.of("type", "integer", "description", "Filter by specific user ID"),
                        "actionType", Map.of("type", "string", "description", "Filter by action type"),
                        "limit", Map.of("type", "integer", "description", "Maximum logs to return")
                )),
                Set.of("ADMIN")
        ));

        return tools;
    }

    /**
     * Returns tool definitions authorized for a specific role.
     */
    public List<ToolDefinition> getAvailableToolsForRole(String role) {
        if (role == null) return Collections.emptyList();
        String upper = role.trim().toUpperCase();
        return getAvailableTools().stream()
                .filter(t -> t.permittedRoles().contains(upper))
                .toList();
    }

    /**
     * Executes a sandboxed tool with strict backend role verification and audit logging.
     */
    public ToolExecutionResult executeTool(String toolName, Map<String, Object> arguments, Integer userId) {
        if (toolName == null || toolName.isBlank()) {
            return new ToolExecutionResult("UNKNOWN", false, null, "No tool name specified.");
        }

        String normalizedName = toolName.trim().toLowerCase();
        ToolDefinition toolDef = getAvailableTools().stream()
                .filter(t -> t.name().equalsIgnoreCase(normalizedName))
                .findFirst()
                .orElse(null);

        if (toolDef == null) {
            return new ToolExecutionResult(toolName, false, null, "Unknown tool requested: " + toolName);
        }

        // Authenticated Identity & Role Validation (Never trust parameters from LLM or client)
        Integer resolvedUserId = userId;
        String userRole = "ADMIN"; // Default for headless standalone tests without SecurityContext

        if (currentUserService != null) {
            var currentUserOpt = currentUserService.getCurrentUser();
            if (currentUserOpt.isEmpty() && currentUserService.getAuthentication() == null) {
                throw new SecurityException("Authentication required: No active authenticated session found.");
            }
            if (currentUserOpt.isPresent()) {
                resolvedUserId = currentUserOpt.get().getUserId();
            }
            userRole = currentUserService.getCurrentUserRole();
        }

        // Enforce role boundary
        if (!toolDef.permittedRoles().contains(userRole)) {
            log.warn("Security Alert: User ID {} with role [{}] attempted unauthorized execution of tool [{}]",
                    resolvedUserId, userRole, toolName);
            recordAuditLog(resolvedUserId, toolName, "FORBIDDEN");
            throw new SecurityException("Access Denied: Role [" + userRole + "] is not authorized to execute tool [" + toolName + "].");
        }

        String status = "SUCCESS";
        Object resultData = null;
        String errorMsg = null;

        try {
            switch (normalizedName) {
                case "query_medicine_stock": {
                    Integer medId = parseInteger(arguments, "medicineId");
                    if (medId == null) throw new IllegalArgumentException("medicineId parameter is required");
                    resultData = stockQueryTool.getMedicineStock(medId);
                    break;
                }
                case "query_low_stock_medicines": {
                    resultData = stockQueryTool.getLowStockMedicines();
                    break;
                }
                case "query_demand_forecast": {
                    Integer medId = parseInteger(arguments, "medicineId");
                    Integer horizon = parseInteger(arguments, "horizonDays");
                    if (medId == null) throw new IllegalArgumentException("medicineId parameter is required");
                    resultData = forecastQueryTool.getDemandForecast(medId, horizon);
                    break;
                }
                case "query_expiring_batches": {
                    Integer days = parseInteger(arguments, "daysThreshold");
                    resultData = expiryQueryTool.getExpiringBatches(days != null ? days : 30);
                    break;
                }
                case "query_supplier_summary": {
                    resultData = supplierQueryTool.getSupplierSummary();
                    break;
                }
                case "query_wastage_loss": {
                    resultData = wastageQueryTool.getExpiredLossSummary();
                    break;
                }
                case "query_purchase_orders": {
                    if (purchaseOrderQueryTool == null) throw new UnsupportedOperationException("PurchaseOrderQueryTool unavailable");
                    String orderStatus = parseString(arguments, "status");
                    Integer limit = parseInteger(arguments, "limit");
                    resultData = purchaseOrderQueryTool.getPurchaseOrders(orderStatus, limit);
                    break;
                }
                case "query_pending_approvals": {
                    if (purchaseOrderQueryTool == null) throw new UnsupportedOperationException("PurchaseOrderQueryTool unavailable");
                    resultData = purchaseOrderQueryTool.getPendingApprovals();
                    break;
                }
                case "query_consumption_history": {
                    if (consumptionAnalyticsTool == null) throw new UnsupportedOperationException("ConsumptionAnalyticsTool unavailable");
                    Integer medId = parseInteger(arguments, "medicineId");
                    Integer days = parseInteger(arguments, "days");
                    if (medId == null) throw new IllegalArgumentException("medicineId parameter is required");
                    resultData = consumptionAnalyticsTool.getConsumptionHistory(medId, days);
                    break;
                }
                case "query_inventory_analytics": {
                    if (consumptionAnalyticsTool == null) throw new UnsupportedOperationException("ConsumptionAnalyticsTool unavailable");
                    resultData = consumptionAnalyticsTool.getInventoryAnalytics();
                    break;
                }
                case "query_purchase_price_trends": {
                    if (consumptionAnalyticsTool == null) throw new UnsupportedOperationException("ConsumptionAnalyticsTool unavailable");
                    Integer medId = parseInteger(arguments, "medicineId");
                    if (medId == null) throw new IllegalArgumentException("medicineId parameter is required");
                    resultData = consumptionAnalyticsTool.getPurchasePriceTrends(medId);
                    break;
                }
                case "query_assigned_tasks": {
                    if (taskQueryTool == null) throw new UnsupportedOperationException("TaskQueryTool unavailable");
                    String taskStatus = parseString(arguments, "status");
                    String priority = parseString(arguments, "priority");
                    resultData = taskQueryTool.getAssignedTasks(taskStatus, priority);
                    break;
                }
                case "query_delivery_history": {
                    if (deliveryQueryTool == null) throw new UnsupportedOperationException("DeliveryQueryTool unavailable");
                    Integer poId = parseInteger(arguments, "purchaseOrderId");
                    resultData = deliveryQueryTool.getDeliveryHistory(poId);
                    break;
                }
                case "query_user_activity": {
                    if (userActivityTool == null) throw new UnsupportedOperationException("UserActivityTool unavailable");
                    Integer targetUserId = parseInteger(arguments, "targetUserId");
                    String actionType = parseString(arguments, "actionType");
                    Integer limit = parseInteger(arguments, "limit");
                    resultData = userActivityTool.getUserActivity(targetUserId, actionType, limit);
                    break;
                }
                default:
                    status = "NOT_FOUND";
                    errorMsg = "Unknown tool requested: " + toolName;
            }
        } catch (SecurityException se) {
            log.warn("Security restriction triggered during tool {}: {}", toolName, se.getMessage());
            status = "FORBIDDEN";
            errorMsg = se.getMessage();
            recordAuditLog(resolvedUserId, toolName, status);
            throw se;
        } catch (Exception e) {
            log.error("Tool execution error for {}: {}", toolName, e.getMessage(), e);
            status = "FAILED";
            errorMsg = e.getMessage();
        }

        recordAuditLog(resolvedUserId, toolName, status);
        return new ToolExecutionResult(toolName, "SUCCESS".equals(status), resultData, errorMsg);
    }

    private void recordAuditLog(Integer userId, String toolName, String status) {
        try {
            if (userId != null && toolLogRepository != null) {
                AIToolLog logEntry = new AIToolLog(userId, toolName, status);
                toolLogRepository.save(logEntry);
            }
        } catch (Exception e) {
            log.warn("Failed to write ai_tool_log: {}", e.getMessage());
        }
    }

    private Integer parseInteger(Map<String, Object> args, String key) {
        if (args == null || !args.containsKey(key)) return null;
        Object val = args.get(key);
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) {
            try { return Integer.parseInt(s.trim()); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private String parseString(Map<String, Object> args, String key) {
        if (args == null || !args.containsKey(key)) return null;
        Object val = args.get(key);
        return (val != null) ? val.toString().trim() : null;
    }
}
