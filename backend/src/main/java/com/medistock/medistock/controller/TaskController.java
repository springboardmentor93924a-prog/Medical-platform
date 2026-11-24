package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.CreateTaskRequest;
import com.medistock.medistock.entity.Task;
import com.medistock.medistock.repository.TaskRepository;
import com.medistock.medistock.service.AuditService;
import com.medistock.medistock.service.CurrentUserService;
import com.medistock.medistock.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public TaskController(TaskRepository taskRepository,
                          CurrentUserService currentUserService,
                          AuditService auditService,
                          NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Task>>> getTasks(@RequestParam(required = false) String status) {
        Integer userId = currentUserService.getCurrentUserId();

        List<Task> tasks;
        if (currentUserService.hasRole("STAFF")) {
            if (status != null && !status.isBlank()) {
                tasks = taskRepository.findByAssignedToAndStatusOrderByDueDateAsc(userId, status.trim().toUpperCase());
            } else {
                tasks = taskRepository.findByAssignedToOrderByDueDateAsc(userId);
            }
        } else {
            if (status != null && !status.isBlank()) {
                tasks = taskRepository.findByStatusOrderByDueDateAsc(status.trim().toUpperCase());
            } else {
                tasks = taskRepository.findAllByOrderByCreatedAtDesc();
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<Task>> updateTaskStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        Optional<Task> taskOpt = taskRepository.findById(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();

        // OWASP API1:2023 - Guard against BOLA/IDOR
        Integer currentUserId = currentUserService.getCurrentUserId();
        boolean isAuthorized = currentUserService.hasRole("ADMIN")
                || currentUserService.hasRole("PHARMACIST")
                || (currentUserId != null && (currentUserId.equals(task.getAssignedTo()) || currentUserId.equals(task.getAssignedBy())));

        if (!isAuthorized) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Access denied: You are not authorized to modify this task"));
        }

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Status is required"));
        }

        task.setStatus(newStatus.trim().toUpperCase());
        if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        Task saved = taskRepository.save(task);

        if (saved.getAssignedTo() != null) {
            notificationService.sendNotification(
                    saved.getAssignedTo(),
                    "Task Status Updated: " + saved.getTitle(),
                    "Task #" + saved.getTaskId() + " status changed to " + saved.getStatus(),
                    "TASK_UPDATED",
                    "TASK",
                    saved.getTaskId(),
                    saved.getPriority()
            );
        }

        auditService.logAction(
                currentUserService.getCurrentUserId(),
                "UPDATE_TASK_STATUS",
                "TASK",
                saved.getTaskId(),
                "Updated task #" + saved.getTaskId() + " status to " + saved.getStatus(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Task status updated", saved));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Task>> createTask(
            @RequestBody CreateTaskRequest req,
            HttpServletRequest request) {

        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Task title is required"));
        }

        Integer userId = currentUserService.getCurrentUserId();

        Task task = new Task();
        task.setTitle(req.getTitle().trim());
        task.setDescription(req.getDescription());
        task.setAssignedBy(userId != null ? userId : 1);
        task.setAssignedTo(req.getAssignedTo() != null ? req.getAssignedTo() : (userId != null ? userId : 1));
        task.setPriority(req.getPriority() != null ? req.getPriority().toUpperCase() : "MEDIUM");
        task.setStatus("PENDING");
        task.setDueDate(req.getDueDate() != null ? req.getDueDate() : LocalDateTime.now().plusDays(1));

        Task saved = taskRepository.save(task);

        if (saved.getAssignedTo() != null) {
            notificationService.sendNotification(
                    saved.getAssignedTo(),
                    "New Task Assigned: " + saved.getTitle(),
                    "You have been assigned task #" + saved.getTaskId() + " with " + saved.getPriority() + " priority.",
                    "TASK_ASSIGNED",
                    "TASK",
                    saved.getTaskId(),
                    saved.getPriority()
            );
        }

        auditService.logAction(
                userId,
                "CREATE_TASK",
                "TASK",
                saved.getTaskId(),
                "Created task: " + saved.getTitle(),
                request
        );

        return ResponseEntity.ok(ApiResponse.ok("Task created successfully", saved));
    }
}
