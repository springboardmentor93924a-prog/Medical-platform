package com.medistock.medistock.ai;

import com.medistock.medistock.ai.entity.AIToolLog;
import com.medistock.medistock.ai.repository.AIToolLogRepository;
import com.medistock.medistock.ai.tools.*;
import com.medistock.medistock.entity.PurchaseOrder;
import com.medistock.medistock.entity.Role;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.entity.Task;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.*;
import com.medistock.medistock.service.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ChatToolSecurityTest {

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
    private CurrentUserService currentUserService;
    private SupplierRepository supplierRepository;
    private PurchaseOrderRepository purchaseOrderRepository;
    private PurchaseOrderItemRepository purchaseOrderItemRepository;
    private TaskRepository taskRepository;
    private UserRepository userRepository;
    private GoodsReceiptRepository goodsReceiptRepository;
    private GoodsReceiptItemRepository goodsReceiptItemRepository;
    private AuditLogRepository auditLogRepository;
    private ChatToolRegistry registry;

    @BeforeEach
    void setUp() {
        stockQueryTool = mock(StockQueryTool.class);
        forecastQueryTool = mock(ForecastQueryTool.class);
        expiryQueryTool = mock(ExpiryQueryTool.class);
        wastageQueryTool = mock(WastageQueryTool.class);
        consumptionAnalyticsTool = mock(ConsumptionAnalyticsTool.class);

        toolLogRepository = mock(AIToolLogRepository.class);
        currentUserService = mock(CurrentUserService.class);
        supplierRepository = mock(SupplierRepository.class);
        purchaseOrderRepository = mock(PurchaseOrderRepository.class);
        purchaseOrderItemRepository = mock(PurchaseOrderItemRepository.class);
        taskRepository = mock(TaskRepository.class);
        userRepository = mock(UserRepository.class);
        goodsReceiptRepository = mock(GoodsReceiptRepository.class);
        goodsReceiptItemRepository = mock(GoodsReceiptItemRepository.class);
        auditLogRepository = mock(AuditLogRepository.class);

        // Real tool instances with mocked repositories to test security & tenant boundaries
        supplierQueryTool = new SupplierQueryTool(supplierRepository, purchaseOrderRepository, currentUserService);
        purchaseOrderQueryTool = new PurchaseOrderQueryTool(purchaseOrderRepository, purchaseOrderItemRepository, supplierRepository, currentUserService);
        taskQueryTool = new TaskQueryTool(taskRepository, userRepository, currentUserService);
        deliveryQueryTool = new DeliveryQueryTool(goodsReceiptRepository, goodsReceiptItemRepository, purchaseOrderRepository, currentUserService);
        userActivityTool = new UserActivityTool(auditLogRepository, userRepository, currentUserService);

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
                currentUserService
        );
    }

    private User createMockUser(int id, String email, String roleName) {
        User u = new User();
        u.setUserId(id);
        u.setEmail(email);
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

    @Test
    @DisplayName("Admin: Has access to all tools, user activity, and financial data")
    void testAdminToolAccess() {
        User admin = createMockUser(1, "admin@medistock.com", "Admin");
        mockSecurityContext(admin, "ADMIN");

        when(wastageQueryTool.getExpiredLossSummary()).thenReturn(Map.of("estimatedFinancialLoss", 5000));
        var result = registry.executeTool("query_wastage_loss", Collections.emptyMap(), 1);

        assertTrue(result.success());
        assertNotNull(result.data());
        verify(toolLogRepository).save(argThat(log -> "SUCCESS".equals(log.getExecutionStatus())));

        // Test user activity tool
        var activityResult = registry.executeTool("query_user_activity", Collections.emptyMap(), 1);
        assertTrue(activityResult.success());
    }

    @Test
    @DisplayName("Pharmacist: Blocked from Admin-only user activity audit logs")
    void testPharmacistBlockedFromUserActivity() {
        User pharmacist = createMockUser(2, "pharm@medistock.com", "Pharmacist");
        mockSecurityContext(pharmacist, "PHARMACIST");

        SecurityException ex = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_user_activity", Collections.emptyMap(), 2)
        );
        assertTrue(ex.getMessage().contains("Access Denied"));
        assertTrue(ex.getMessage().contains("PHARMACIST"));
    }

    @Test
    @DisplayName("Staff: Can query medicine stock and tasks, but is blocked from financial wastage and POs")
    void testStaffWastageBlocked() {
        User staff = createMockUser(3, "staff@medistock.com", "Staff");
        mockSecurityContext(staff, "STAFF");

        // 1. Permitted stock query
        when(stockQueryTool.getMedicineStock(1)).thenReturn(Map.of("found", true, "usableUnitsOnHand", 100));
        var stockResult = registry.executeTool("query_medicine_stock", Map.of("medicineId", 1), 3);
        assertTrue(stockResult.success());

        // 2. Blocked financial query
        SecurityException ex = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_wastage_loss", Collections.emptyMap(), 3)
        );
        assertTrue(ex.getMessage().contains("Access Denied"));
        assertTrue(ex.getMessage().contains("STAFF"));

        // 3. Blocked purchase orders query
        SecurityException poEx = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_purchase_orders", Collections.emptyMap(), 3)
        );
        assertTrue(poEx.getMessage().contains("Access Denied"));

        // Verify audit log captured FORBIDDEN
        ArgumentCaptor<AIToolLog> logCaptor = ArgumentCaptor.forClass(AIToolLog.class);
        verify(toolLogRepository, atLeastOnce()).save(logCaptor.capture());
        assertTrue(logCaptor.getAllValues().stream().anyMatch(l -> "FORBIDDEN".equals(l.getExecutionStatus())));
    }

    @Test
    @DisplayName("Staff: Can query assigned tasks with user ID isolation")
    void testStaffAssignedTasksIsolation() {
        User staff = createMockUser(3, "staff@medistock.com", "Staff");
        mockSecurityContext(staff, "STAFF");

        Task myTask = new Task();
        myTask.setTaskId(101);
        myTask.setTitle("Restock emergency cart");
        myTask.setAssignedTo(3);
        myTask.setPriority("HIGH");
        myTask.setStatus("PENDING");

        when(taskRepository.findByAssignedToOrderByDueDateAsc(3)).thenReturn(List.of(myTask));

        var result = registry.executeTool("query_assigned_tasks", Collections.emptyMap(), 3);
        assertTrue(result.success());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list = (List<Map<String, Object>>) result.data();
        assertEquals(1, list.size());
        assertEquals("Restock emergency cart", list.get(0).get("title"));

        // Verify findAllByOrderByCreatedAtDesc was never called for Staff
        verify(taskRepository, never()).findAllByOrderByCreatedAtDesc();
    }

    @Test
    @DisplayName("Supplier: Strictly isolated to own supplier profile and purchase orders")
    void testSupplierTenantIsolation() {
        User supplierUser = createMockUser(6, "supplier@medistock.com", "Supplier");
        mockSecurityContext(supplierUser, "SUPPLIER");

        Supplier apexSupplier = new Supplier();
        apexSupplier.setSupplierId(11);
        apexSupplier.setSupplierName("Apex Medical Supplies Ltd");
        apexSupplier.setEmail("supplier@medistock.com");
        apexSupplier.setContactPerson("Jennifer White");
        apexSupplier.setPhone("+1 555-0103");

        when(currentUserService.getSupplierForCurrentUser()).thenReturn(Optional.of(apexSupplier));

        PurchaseOrder po1 = new PurchaseOrder();
        po1.setPurchaseOrderId(101);
        po1.setSupplierId(11);
        po1.setStatus("ORDERED");

        when(purchaseOrderRepository.findBySupplierIdOrderByOrderDateDesc(11)).thenReturn(List.of(po1));

        // 1. Supplier summary tool
        var result = registry.executeTool("query_supplier_summary", Collections.emptyMap(), 6);
        assertTrue(result.success());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list = (List<Map<String, Object>>) result.data();
        assertEquals(1, list.size(), "Supplier must see only its own tenant profile");
        assertEquals(11, list.get(0).get("supplierId"));

        // 2. Purchase orders tool
        var poResult = registry.executeTool("query_purchase_orders", Collections.emptyMap(), 6);
        assertTrue(poResult.success());

        // 3. Blocked from pending approvals queue
        SecurityException appEx = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_pending_approvals", Collections.emptyMap(), 6)
        );
        assertTrue(appEx.getMessage().contains("Access Denied"));
    }

    @Test
    @DisplayName("Supplier: Blocked from internal hospital tasks and hospital stock")
    void testSupplierHospitalTasksBlocked() {
        User supplierUser = createMockUser(6, "supplier@medistock.com", "Supplier");
        mockSecurityContext(supplierUser, "SUPPLIER");

        // Blocked from hospital tasks
        SecurityException taskEx = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_assigned_tasks", Collections.emptyMap(), 6)
        );
        assertTrue(taskEx.getMessage().contains("Access Denied"));

        // Blocked from internal hospital stock
        SecurityException stockEx = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_medicine_stock", Map.of("medicineId", 1), 6)
        );
        assertTrue(stockEx.getMessage().contains("Access Denied"));
    }

    @Test
    @DisplayName("Supplier: Fails safely when authenticated user is not mapped to any supplier in DB")
    void testSupplierUnmappedSafety() {
        User orphanSupplier = createMockUser(99, "unknown.vendor@example.com", "Supplier");
        mockSecurityContext(orphanSupplier, "SUPPLIER");

        when(currentUserService.getSupplierForCurrentUser()).thenReturn(Optional.empty());

        SecurityException ex = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_supplier_summary", Collections.emptyMap(), 99)
        );
        assertTrue(ex.getMessage().contains("No active wholesale supplier profile is associated"));
    }

    @Test
    @DisplayName("Security: Unauthenticated execution is rejected")
    void testUnauthenticatedExecutionRejected() {
        when(currentUserService.getAuthentication()).thenReturn(null);
        when(currentUserService.getCurrentUser()).thenReturn(Optional.empty());

        SecurityException ex = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_medicine_stock", Map.of("medicineId", 1), null)
        );
        assertTrue(ex.getMessage().contains("Authentication required"));
    }

    @Test
    @DisplayName("Parameter Tampering: Client cannot elevate role or spoof supplierId via arguments")
    void testParameterTamperingIgnored() {
        User staff = createMockUser(3, "staff@medistock.com", "Staff");
        mockSecurityContext(staff, "STAFF");

        Map<String, Object> maliciousArgs = new HashMap<>();
        maliciousArgs.put("role", "ADMIN");
        maliciousArgs.put("userId", 1);
        maliciousArgs.put("supplierId", 1);

        SecurityException ex = assertThrows(SecurityException.class, () ->
                registry.executeTool("query_wastage_loss", maliciousArgs, 3)
        );
        assertTrue(ex.getMessage().contains("Access Denied"));
        assertTrue(ex.getMessage().contains("STAFF"));
    }

    @Test
    @DisplayName("Tool Registry: Exposes only authorized tools for each role")
    void testAvailableToolsForRole() {
        var adminTools = registry.getAvailableToolsForRole("ADMIN");
        assertEquals(14, adminTools.size(), "Admin should have access to all 14 tools");

        var pharmacistTools = registry.getAvailableToolsForRole("PHARMACIST");
        assertEquals(13, pharmacistTools.size(), "Pharmacist has all tools except admin user activity");
        assertFalse(pharmacistTools.stream().anyMatch(t -> t.name().equals("query_user_activity")));

        var staffTools = registry.getAvailableToolsForRole("STAFF");
        assertEquals(3, staffTools.size(), "Staff has stock query, assigned tasks, and delivery history");
        assertTrue(staffTools.stream().anyMatch(t -> t.name().equals("query_medicine_stock")));
        assertTrue(staffTools.stream().anyMatch(t -> t.name().equals("query_assigned_tasks")));
        assertTrue(staffTools.stream().anyMatch(t -> t.name().equals("query_delivery_history")));

        var supplierTools = registry.getAvailableToolsForRole("SUPPLIER");
        assertEquals(3, supplierTools.size(), "Supplier has supplier summary, purchase orders, and delivery history");
        assertTrue(supplierTools.stream().anyMatch(t -> t.name().equals("query_supplier_summary")));
        assertTrue(supplierTools.stream().anyMatch(t -> t.name().equals("query_purchase_orders")));
        assertTrue(supplierTools.stream().anyMatch(t -> t.name().equals("query_delivery_history")));
    }
}
