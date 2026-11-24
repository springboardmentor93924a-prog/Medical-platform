package com.medistock.medistock.ai.tools;

import com.medistock.medistock.entity.Task;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.TaskRepository;
import com.medistock.medistock.repository.UserRepository;
import com.medistock.medistock.service.CurrentUserService;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TaskQueryTool {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public TaskQueryTool(
            TaskRepository taskRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves assigned tasks with role scoping:
     * Staff: Strictly isolated to tasks assigned to their user ID.
     * Admin/Pharmacist: Hospital-wide operational tasks.
     * Supplier: Blocked.
     */
    public List<Map<String, Object>> getAssignedTasks(String status, String priority) {
        String role = currentUserService != null ? currentUserService.getCurrentUserRole() : "ADMIN";

        if ("SUPPLIER".equalsIgnoreCase(role)) {
            throw new SecurityException("Access Denied: Suppliers are not authorized to view internal hospital tasks.");
        }

        List<Task> tasks;

        if ("STAFF".equalsIgnoreCase(role)) {
            Integer staffUserId = currentUserService != null ? currentUserService.getCurrentUserId() : null;
            if (staffUserId == null) {
                throw new SecurityException("Authentication context unavailable: Cannot resolve staff user ID.");
            }
            if (status != null && !status.isBlank()) {
                tasks = taskRepository.findByAssignedToAndStatusOrderByDueDateAsc(staffUserId, status.trim().toUpperCase());
            } else {
                tasks = taskRepository.findByAssignedToOrderByDueDateAsc(staffUserId);
            }
        } else {
            // ADMIN or PHARMACIST
            if (status != null && !status.isBlank()) {
                tasks = taskRepository.findByStatusOrderByDueDateAsc(status.trim().toUpperCase());
            } else {
                tasks = taskRepository.findAllByOrderByCreatedAtDesc();
            }
        }

        if (priority != null && !priority.isBlank()) {
            tasks = tasks.stream()
                    .filter(t -> priority.equalsIgnoreCase(t.getPriority()))
                    .toList();
        }

        Map<Integer, String> userNameCache = new HashMap<>();
        List<Map<String, Object>> results = new ArrayList<>();

        for (Task t : tasks) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("taskId", t.getTaskId());
            map.put("title", t.getTitle());
            map.put("description", t.getDescription());
            map.put("priority", t.getPriority());
            map.put("status", t.getStatus());
            map.put("dueDate", t.getDueDate());
            map.put("assignedTo", t.getAssignedTo());

            String assigneeName = userNameCache.computeIfAbsent(t.getAssignedTo(), id -> {
                User u = userRepository.findById(id).orElse(null);
                return u != null ? u.getFullName() : "User #" + id;
            });
            map.put("assignedToName", assigneeName);
            results.add(map);
        }

        return results;
    }
}

