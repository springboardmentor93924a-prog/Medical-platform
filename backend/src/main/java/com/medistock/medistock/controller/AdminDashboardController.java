package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ContactDto;
import com.medistock.medistock.dto.BulkMedicinePriceRequestDto;
import com.medistock.medistock.dto.DashboardStatsDto;
import com.medistock.medistock.dto.AdminUserDto;
import com.medistock.medistock.dto.AdminUserRequestDto;
import com.medistock.medistock.dto.InventoryMovementDto;
import com.medistock.medistock.dto.InventoryReportDto;
import com.medistock.medistock.dto.MedicineCatalogDto;
import com.medistock.medistock.dto.MessageDto;
import com.medistock.medistock.dto.MedicineRequestDto;
import com.medistock.medistock.dto.NotificationDto;
import com.medistock.medistock.dto.PurchaseOrderDto;
import com.medistock.medistock.dto.PurchaseOrderRequestDto;
import com.medistock.medistock.dto.PosMedicineDto;
import com.medistock.medistock.dto.SaleDto;
import com.medistock.medistock.dto.SaleRequestDto;
import com.medistock.medistock.dto.SendMessageRequest;
import com.medistock.medistock.entity.Category;
import com.medistock.medistock.entity.Medicine;
import com.medistock.medistock.entity.Supplier;
import com.medistock.medistock.service.AdminDashboardService;
import com.medistock.medistock.service.AdminUserService;
import com.medistock.medistock.service.MessageService;
import com.medistock.medistock.service.PosService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AdminUserService adminUserService;
    private final MessageService messageService;
    private final PosService posService;

    public AdminDashboardController(
            AdminDashboardService adminDashboardService,
            AdminUserService adminUserService,
            MessageService messageService,
            PosService posService) {
        this.adminDashboardService = adminDashboardService;
        this.adminUserService = adminUserService;
        this.messageService = messageService;
        this.posService = posService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getUsers() {
        return ResponseEntity.ok(adminUserService.getUsers());
    }

    @GetMapping("/roles")
    public ResponseEntity<List<com.medistock.medistock.entity.Role>> getRoles() {
        return ResponseEntity.ok(adminUserService.getRoles());
    }

    @PostMapping("/users")
    public ResponseEntity<AdminUserDto> createUser(@RequestBody AdminUserRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createUser(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable("id") Integer id,
            @RequestBody AdminUserRequestDto request) {
        return ResponseEntity.ok(adminUserService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Integer id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        DashboardStatsDto stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/medicines")
    public ResponseEntity<List<MedicineCatalogDto>> getAllMedicines() {
        return ResponseEntity.ok(adminDashboardService.getAllMedicines());
    }

    @GetMapping("/reports/inventory")
    public ResponseEntity<List<InventoryReportDto>> getInventoryReport() {
        return ResponseEntity.ok(adminDashboardService.getInventoryReport());
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getNotifications() {
        return ResponseEntity.ok(adminDashboardService.getNotifications());
    }

    @PutMapping("/notifications/read")
    public ResponseEntity<Map<String, Long>> markAllNotificationsAsRead() {
        return ResponseEntity.ok(Map.of(
                "unreadCount",
                adminDashboardService.markAllNotificationsAsRead()));
    }

    @GetMapping("/inventory/movements")
    public ResponseEntity<List<InventoryMovementDto>> getInventoryMovements() {
        return ResponseEntity.ok(adminDashboardService.getInventoryMovements());
    }

    @GetMapping("/purchase-orders")
    public ResponseEntity<List<PurchaseOrderDto>> getPurchaseOrders() {
        return ResponseEntity.ok(adminDashboardService.getPurchaseOrders());
    }

    @GetMapping("/purchase-orders/{id}")
    public ResponseEntity<PurchaseOrderDto> getPurchaseOrder(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(adminDashboardService.getPurchaseOrder(id));
    }

    @PostMapping("/purchase-orders")
    public ResponseEntity<PurchaseOrderDto> createPurchaseOrder(@RequestBody PurchaseOrderRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminDashboardService.createPurchaseOrder(request));
    }

    @PutMapping("/purchase-orders/{id}/status")
    public ResponseEntity<PurchaseOrderDto> updatePurchaseOrderStatus(
            @PathVariable("id") Integer id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(adminDashboardService.updatePurchaseOrderStatus(id, request.get("status")));
    }

    @PutMapping("/purchase-orders/{id}")
    public ResponseEntity<PurchaseOrderDto> updatePurchaseOrder(
            @PathVariable("id") Integer id,
            @RequestBody PurchaseOrderRequestDto request) {
        return ResponseEntity.ok(adminDashboardService.updatePurchaseOrder(id, request));
    }

    @DeleteMapping("/purchase-orders/{id}")
    public ResponseEntity<Map<String, Object>> deletePurchaseOrder(@PathVariable("id") Integer id) {
        adminDashboardService.deletePurchaseOrder(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Purchase order deleted successfully"));
    }

    @GetMapping("/pos/medicines")
    public ResponseEntity<List<PosMedicineDto>> searchPosMedicines(
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(posService.searchMedicines(search));
    }

    @PostMapping("/pos/sales")
    public ResponseEntity<SaleDto> createSale(@RequestBody SaleRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(posService.createSale(request));
    }

    @GetMapping("/pos/sales")
    public ResponseEntity<List<SaleDto>> getSales() {
        return ResponseEntity.ok(posService.getSales());
    }

    @GetMapping("/pos/sales/{id}")
    public ResponseEntity<SaleDto> getSale(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(posService.getSale(id));
    }

    @PostMapping("/medicines")
    public ResponseEntity<Map<String, Object>> addMedicine(@RequestBody MedicineRequestDto request) {
        Medicine saved = adminDashboardService.saveMedicineWithBatch(request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Medicine stored successfully in database");
        response.put("medicineId", saved.getMedicineId());
        response.put("medicineName", saved.getMedicineName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/medicines/{id}")
    public ResponseEntity<Map<String, Object>> updateMedicine(
            @PathVariable("id") Integer id,
            @RequestBody MedicineRequestDto request) {
        Medicine saved = adminDashboardService.updateMedicineWithBatch(id, request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Medicine updated successfully",
                "medicineId", saved.getMedicineId(),
                "medicineName", saved.getMedicineName()));
    }

    @DeleteMapping("/medicines/{id}")
    public ResponseEntity<Void> deleteMedicine(@PathVariable("id") Integer id) {
        adminDashboardService.deleteMedicine(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/medicines/prices/by-supplier")
    public ResponseEntity<Map<String, Object>> updateMedicinePricesBySupplier(
            @RequestBody BulkMedicinePriceRequestDto request) {
        int updatedBatches = adminDashboardService.updateMedicinePricesBySupplier(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "updatedBatches", updatedBatches,
                "message", "Selling prices updated successfully"));
    }

    @GetMapping("/suppliers")
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(adminDashboardService.getAllSuppliers());
    }

    @PostMapping("/suppliers")
    public ResponseEntity<Supplier> addSupplier(@RequestBody Supplier supplier) {
        Supplier saved = adminDashboardService.saveSupplier(supplier);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/suppliers/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable("id") Integer id, @RequestBody Supplier supplier) {
        Supplier updated = adminDashboardService.updateSupplier(id, supplier);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<Map<String, Object>> deleteSupplier(@PathVariable("id") Integer id) {
        adminDashboardService.deleteSupplier(id);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Supplier deleted successfully");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(adminDashboardService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> addCategory(@RequestBody Category category) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminDashboardService.saveCategory(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable("id") Integer id,
            @RequestBody Category category) {
        return ResponseEntity.ok(adminDashboardService.updateCategory(id, category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable("id") Integer id) {
        adminDashboardService.deleteCategory(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Category deleted successfully.");
        return ResponseEntity.ok(response);
    }

    // ================= MESSAGES & INTERNAL COMMUNICATION =================

    @GetMapping("/contacts")
    public ResponseEntity<List<ContactDto>> getContacts(@RequestParam(value = "userId", required = false) Integer userId) {
        return ResponseEntity.ok(messageService.getContacts(userId));
    }

    @GetMapping("/messages")
    public ResponseEntity<List<MessageDto>> getConversation(
            @RequestParam(value = "userId", required = false) Integer userId,
            @RequestParam("contactId") Integer contactId) {
        return ResponseEntity.ok(messageService.getConversation(userId, contactId));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageDto> sendMessage(@RequestBody SendMessageRequest request) {
        MessageDto sent = messageService.sendMessage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "MediStock Admin Backend");
        status.put("database", "MySQL Connected");
        return ResponseEntity.ok(status);
    }
}
