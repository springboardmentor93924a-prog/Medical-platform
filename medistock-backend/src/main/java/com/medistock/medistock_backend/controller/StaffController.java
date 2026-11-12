package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.entity.*;
import com.medistock.medistock_backend.repository.*;
import com.medistock.medistock_backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_STAFF', 'STAFF')")
public class StaffController {

    private final StaffTaskRepository taskRepo;
    private final UserRepository userRepo;
    private final PurchaseOrderRepository orderRepo;
    private final MedicineRepository medicineRepo;
    private final AuditService auditService;

    @PostMapping("/purchase-orders/{id}/receive")
    @PreAuthorize("hasAnyAuthority('ROLE_STAFF', 'STAFF', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> receiveOrder(@PathVariable Long id) {
        try {
            PurchaseOrder order = orderRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            order.setStatus("RECEIVED");
            orderRepo.save(order);

            if (order.getItems() != null) {
                for (PurchaseOrderItem item : order.getItems()) {
                    Medicine med = item.getMedicine();
                    if (med != null) {
                        int newQty = (med.getQuantity() != null ? med.getQuantity() : 0) + item.getQuantity();
                        med.setQuantity(newQty);
                        med.setUpdatedAt(LocalDateTime.now());
                        medicineRepo.save(med);
                    }
                }
            }

            auditService.log("RECEIVE_ORDER", "PURCHASE_ORDER", id,
                    "Received " + order.getOrderNumber() + " — stock updated");

            return ResponseEntity.ok(Map.of(
                    "message", "Order received and stock updated successfully",
                    "orderNumber", order.getOrderNumber()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/users/staff")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllStaff() {
        List<User> staffUsers = userRepo.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().stream()
                        .anyMatch(r -> r.getName().equals("STAFF") || r.getName().equals("ROLE_STAFF")))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = staffUsers.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            Long staffId = Long.parseLong(body.get("assignedToId").toString());
            User staff = userRepo.findById(staffId)
                    .orElseThrow(() -> new RuntimeException("Staff not found"));

            User admin = userRepo.findByEmail(auth.getName()).orElse(null);

            StaffTask task = new StaffTask();
            task.setTitle(body.get("title").toString());
            task.setDescription(body.get("description") != null ? body.get("description").toString() : "");
            task.setPriority(body.get("priority") != null ? body.get("priority").toString() : "NORMAL");
            task.setStatus("PENDING");
            task.setAssignedTo(staff);
            task.setAssignedBy(admin);

            taskRepo.save(task);

            auditService.log("ASSIGN_TASK", "TASK", task.getId(),
                    "Assigned '" + task.getTitle() + "' to " + staff.getFullName());

            return ResponseEntity.ok(Map.of("message", "Task assigned successfully", "taskId", task.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllTasks() {
        return ResponseEntity.ok(mapTasksToResponse(taskRepo.findAll()));
    }

    @GetMapping("/tasks/my-tasks")
    @PreAuthorize("hasAnyAuthority('ROLE_STAFF', 'STAFF')")
    public ResponseEntity<List<Map<String, Object>>> getMyTasks(Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(mapTasksToResponse(taskRepo.findByAssignedToIdOrderByCreatedAtDesc(user.getId())));
    }

    @PutMapping("/tasks/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_STAFF', 'STAFF', 'ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> updateTaskStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            StaffTask task = taskRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Task not found"));
            String newStatus = body.get("status").toUpperCase();
            task.setStatus(newStatus);
            if ("COMPLETED".equals(newStatus)) {
                task.setCompletedAt(LocalDateTime.now());
            }
            taskRepo.save(task);

            auditService.log("UPDATE_TASK", "TASK", id,
                    "'" + task.getTitle() + "' → " + newStatus);

            return ResponseEntity.ok(Map.of("message", "Task updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/tasks/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        auditService.log("DELETE_TASK", "TASK", id, "Deleted task ID " + id);
        taskRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Task deleted"));
    }

    private List<Map<String, Object>> mapTasksToResponse(List<StaffTask> tasks) {
        return tasks.stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("title", t.getTitle());
            m.put("description", t.getDescription());
            m.put("status", t.getStatus());
            m.put("priority", t.getPriority());
            m.put("createdAt", t.getCreatedAt());
            m.put("completedAt", t.getCompletedAt());
            m.put("assignedToId", t.getAssignedTo() != null ? t.getAssignedTo().getId() : null);
            m.put("assignedToName", t.getAssignedTo() != null ? t.getAssignedTo().getFullName() : "Unknown");
            m.put("assignedToEmail", t.getAssignedTo() != null ? t.getAssignedTo().getEmail() : "");
            m.put("assignedByName", t.getAssignedBy() != null ? t.getAssignedBy().getFullName() : "Admin");
            return m;
        }).collect(Collectors.toList());
    }
}