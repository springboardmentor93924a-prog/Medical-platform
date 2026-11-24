package com.medistock.medistock.ai;

import com.medistock.medistock.ai.repository.AIToolLogRepository;
import com.medistock.medistock.ai.tools.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatToolRegistryTest {

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
    private ChatToolRegistry registry;

    @BeforeEach
    void setUp() {
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
        toolLogRepository = mock(AIToolLogRepository.class);

        registry = new ChatToolRegistry(
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
                null // null currentUserService defaults to ADMIN in standalone test mode
        );
    }

    @Test
    @DisplayName("Tool Registry: Exposes all 14 dynamic inventory tools")
    void testAvailableTools() {
        var tools = registry.getAvailableTools();
        assertEquals(14, tools.size());

        // Baseline Clinical Tools
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_medicine_stock")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_low_stock_medicines")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_demand_forecast")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_expiring_batches")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_supplier_summary")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_wastage_loss")));

        // New Dynamic Inventory & Workflow Tools
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_purchase_orders")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_pending_approvals")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_consumption_history")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_inventory_analytics")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_purchase_price_trends")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_assigned_tasks")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_delivery_history")));
        assertTrue(tools.stream().anyMatch(t -> t.name().equals("query_user_activity")));
    }

    @Test
    @DisplayName("Tool Execution: query_medicine_stock delegates and writes audit log")
    void testExecuteMedicineStock() {
        when(stockQueryTool.getMedicineStock(1)).thenReturn(Map.of("found", true, "medicineName", "Paracetamol"));

        var result = registry.executeTool("query_medicine_stock", Map.of("medicineId", 1), 2);

        assertTrue(result.success());
        assertEquals("query_medicine_stock", result.toolName());
        assertNotNull(result.data());
        verify(stockQueryTool, times(1)).getMedicineStock(1);
        verify(toolLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Tool Execution: Delegates new tools correctly")
    void testExecuteNewTools() {
        when(purchaseOrderQueryTool.getPendingApprovals()).thenReturn(Map.of("pendingApprovalCount", 3));
        var poResult = registry.executeTool("query_pending_approvals", Collections.emptyMap(), 1);
        assertTrue(poResult.success());
        verify(purchaseOrderQueryTool, times(1)).getPendingApprovals();

        when(consumptionAnalyticsTool.getPurchasePriceTrends(1)).thenReturn(Map.of("hasHistoricalOrders", true));
        var priceResult = registry.executeTool("query_purchase_price_trends", Map.of("medicineId", 1), 1);
        assertTrue(priceResult.success());
        verify(consumptionAnalyticsTool, times(1)).getPurchasePriceTrends(1);

        when(taskQueryTool.getAssignedTasks(null, null)).thenReturn(List.of(Map.of("taskId", 10)));
        var taskResult = registry.executeTool("query_assigned_tasks", Collections.emptyMap(), 1);
        assertTrue(taskResult.success());
        verify(taskQueryTool, times(1)).getAssignedTasks(null, null);
    }

    @Test
    @DisplayName("Tool Execution: Handles unknown tool name gracefully")
    void testUnknownTool() {
        var result = registry.executeTool("unknown_arbitrary_tool", Collections.emptyMap(), 2);
        assertFalse(result.success());
        assertTrue(result.errorMessage().contains("Unknown tool"));
    }
}
