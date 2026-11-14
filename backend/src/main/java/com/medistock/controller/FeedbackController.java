package com.medistock.controller;

import com.medistock.dto.request.FeedbackRequest;
import com.medistock.dto.request.FeedbackStatusUpdateRequest;
import com.medistock.dto.response.ApiResponse;
import com.medistock.entity.Feedback;
import com.medistock.enums.FeedbackCategory;
import com.medistock.enums.FeedbackStatus;
import com.medistock.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<Feedback>> submitFeedback(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FeedbackRequest request) {
        Feedback submitted = feedbackService.submitFeedback(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thank you for your feedback. Our administration team has been notified.", submitted));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<Feedback>>> getAllFeedback(
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) FeedbackCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getAllFeedback(status, category, pageable)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<Page<Feedback>>> getMyFeedback(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getMyFeedback(userDetails.getUsername(), pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER')")
    public ResponseEntity<ApiResponse<Feedback>> getFeedbackById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getFeedbackById(id)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Feedback>> updateFeedbackStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FeedbackStatusUpdateRequest request) {
        Feedback updated = feedbackService.updateFeedbackStatus(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Feedback status updated successfully", updated));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFeedbackStats() {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getFeedbackStats()));
    }
}
