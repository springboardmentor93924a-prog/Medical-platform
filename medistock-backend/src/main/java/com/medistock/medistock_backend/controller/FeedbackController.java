package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.entity.Feedback;
import com.medistock.medistock_backend.repository.FeedbackRepository;
import com.medistock.medistock_backend.repository.UserRepository;
import com.medistock.medistock_backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepo;
    private final UserRepository userRepo;
    private final AuditService auditService;

    // ==========================================
    // SUBMIT FEEDBACK (Any authenticated user)
    // ==========================================
    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            String email = auth.getName();
            String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            String name = userRepo.findByEmail(email)
                    .map(u -> u.getFullName())
                    .orElse(email);

            Feedback fb = new Feedback();
            fb.setTitle(body.get("title"));
            fb.setMessage(body.get("message"));
            fb.setCategory(body.getOrDefault("category", "GENERAL").toUpperCase());
            fb.setPriority(body.getOrDefault("priority", "MEDIUM").toUpperCase());
            fb.setStatus("OPEN");
            fb.setSubmittedByEmail(email);
            fb.setSubmittedByName(name);
            fb.setSubmittedByRole(role);

            feedbackRepo.save(fb);

            auditService.log("SUBMIT_FEEDBACK", "FEEDBACK", fb.getId(),
                    "Submitted: " + fb.getTitle() + " (" + fb.getCategory() + ")");

            return ResponseEntity.ok(Map.of("message", "Feedback submitted", "id", fb.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    // ==========================================
    // VIEW ALL FEEDBACK (Admin only)
    // ==========================================
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        return ResponseEntity.ok(feedbackRepo.findAllByOrderByCreatedAtDesc());
    }

    // ==========================================
    // VIEW MY OWN FEEDBACK (Any user)
    // ==========================================
    @GetMapping("/my-feedback")
    public ResponseEntity<List<Feedback>> getMyFeedback(Authentication auth) {
        return ResponseEntity.ok(feedbackRepo.findBySubmittedByEmailOrderByCreatedAtDesc(auth.getName()));
    }

    // ==========================================
    // UPDATE STATUS / REPLY (Admin only)
    // ==========================================
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateFeedback(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Feedback fb = feedbackRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Feedback not found"));

            if (body.containsKey("status")) {
                String newStatus = body.get("status").toUpperCase();
                fb.setStatus(newStatus);
                if ("RESOLVED".equals(newStatus) || "REJECTED".equals(newStatus)) {
                    fb.setResolvedAt(LocalDateTime.now());
                }
            }
            if (body.containsKey("adminReply")) {
                fb.setAdminReply(body.get("adminReply"));
            }

            feedbackRepo.save(fb);

            auditService.log("UPDATE_FEEDBACK", "FEEDBACK", id,
                    "Status → " + fb.getStatus());

            return ResponseEntity.ok(Map.of("message", "Feedback updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    // ==========================================
    // DELETE FEEDBACK (Admin only)
    // ==========================================
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long id) {
        feedbackRepo.deleteById(id);
        auditService.log("DELETE_FEEDBACK", "FEEDBACK", id, "Deleted feedback ID " + id);
        return ResponseEntity.ok(Map.of("message", "Feedback deleted"));
    }
}