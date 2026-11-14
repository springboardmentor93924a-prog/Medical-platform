package com.medistock.service.impl;

import com.medistock.dto.request.FeedbackRequest;
import com.medistock.dto.request.FeedbackStatusUpdateRequest;
import com.medistock.entity.Feedback;
import com.medistock.entity.User;
import com.medistock.enums.FeedbackCategory;
import com.medistock.enums.FeedbackStatus;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.FeedbackRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.FeedbackService;
import com.medistock.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final com.medistock.repository.SupplierRepository supplierRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public FeedbackServiceImpl(FeedbackRepository feedbackRepository,
                               UserRepository userRepository,
                               com.medistock.repository.SupplierRepository supplierRepository,
                               NotificationService notificationService,
                               AuditLogService auditLogService) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    private void enrichFeedback(Feedback fb) {
        if (fb == null || fb.getUser() == null) return;
        if (fb.getUser().getRole() == Role.SUPPLIER) {
            supplierRepository.findByUserId(fb.getUser().getId())
                    .or(() -> supplierRepository.findByUserEmail(fb.getUser().getEmail()))
                    .ifPresent(s -> {
                        fb.setSupplierCompanyName(s.getCompanyName());
                        fb.setSupplierContactPerson(s.getContactPerson());
                    });
        }
    }

    @Override
    @Transactional
    public Feedback submitFeedback(FeedbackRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Feedback feedback = new Feedback();
        feedback.setSubject(request.getSubject().trim());
        feedback.setCategory(request.getCategory());
        feedback.setDescription(request.getDescription().trim());
        feedback.setRating(request.getRating());
        feedback.setStatus(FeedbackStatus.SUBMITTED);
        feedback.setUser(user);

        Feedback saved = feedbackRepository.save(feedback);

        // Notify Admins
        notificationService.sendNotification(
                null,
                Role.ADMIN,
                "New Feedback: " + feedback.getSubject(),
                "A new " + feedback.getCategory() + " was submitted by " + user.getFullName() + " (" + user.getRole() + ").",
                NotificationType.SYSTEM
        );

        auditLogService.log(userEmail, user.getRole().name(), "SUBMIT_FEEDBACK", "Feedback", saved.getId().toString(),
                "Submitted " + saved.getCategory() + ": " + saved.getSubject());

        return saved;
    }

    @Override
    @Transactional
    public Feedback updateFeedbackStatus(Long id, FeedbackStatusUpdateRequest request, String adminEmail) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with ID: " + id));

        feedback.setStatus(request.getStatus());
        if (request.getAdminResponse() != null && !request.getAdminResponse().isBlank()) {
            feedback.setAdminResponse(request.getAdminResponse().trim());
        }

        Feedback updated = feedbackRepository.save(feedback);

        // Notify the user who submitted feedback
        notificationService.sendNotification(
                feedback.getUser(),
                null,
                "Feedback Status Update: " + feedback.getSubject(),
                "Your feedback '" + feedback.getSubject() + "' status has been updated to " + feedback.getStatus().name() + (feedback.getAdminResponse() != null ? ". Admin Note: " + feedback.getAdminResponse() : "."),
                NotificationType.SYSTEM
        );

        auditLogService.log(adminEmail, "ADMIN", "UPDATE_FEEDBACK_STATUS", "Feedback", updated.getId().toString(),
                "Updated feedback status to " + updated.getStatus());

        return updated;
    }

    @Override
    public Page<Feedback> getAllFeedback(FeedbackStatus status, FeedbackCategory category, Pageable pageable) {
        Page<Feedback> page = feedbackRepository.filterFeedback(status, category, pageable);
        page.getContent().forEach(this::enrichFeedback);
        return page;
    }

    @Override
    public Page<Feedback> getMyFeedback(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Page<Feedback> page = feedbackRepository.findByUserId(user.getId(), pageable);
        page.getContent().forEach(this::enrichFeedback);
        return page;
    }

    @Override
    public Feedback getFeedbackById(Long id) {
        Feedback fb = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with ID: " + id));
        enrichFeedback(fb);
        return fb;
    }

    @Override
    public Map<String, Object> getFeedbackStats() {
        Map<String, Object> stats = new HashMap<>();
        long submitted = feedbackRepository.countByStatus(FeedbackStatus.SUBMITTED);
        long underReview = feedbackRepository.countByStatus(FeedbackStatus.UNDER_REVIEW);
        long inProgress = feedbackRepository.countByStatus(FeedbackStatus.IN_PROGRESS);
        long resolved = feedbackRepository.countByStatus(FeedbackStatus.RESOLVED);
        long total = feedbackRepository.count();

        stats.put("totalSubmitted", submitted);
        stats.put("totalUnderReview", underReview);
        stats.put("totalInProgress", inProgress);
        stats.put("totalResolved", resolved);
        stats.put("totalFeedback", total);

        stats.put("total", total);
        stats.put("pending", submitted);
        stats.put("underReview", underReview);
        stats.put("resolved", resolved);
        return stats;
    }
}
