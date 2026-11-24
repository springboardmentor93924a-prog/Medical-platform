package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.feedback.*;
import com.medistock.medistock.entity.FeedbackInternalNote;
import com.medistock.medistock.entity.FeedbackTicket;
import com.medistock.medistock.service.FeedbackAiService;
import com.medistock.medistock.service.FeedbackAnalyticsService;
import com.medistock.medistock.service.FeedbackService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/feedback")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeedbackController {

    private final FeedbackService feedbackService;
    private final FeedbackAnalyticsService feedbackAnalyticsService;
    private final FeedbackAiService feedbackAiService;

    public AdminFeedbackController(FeedbackService feedbackService,
                                   FeedbackAnalyticsService feedbackAnalyticsService,
                                   FeedbackAiService feedbackAiService) {
        this.feedbackService = feedbackService;
        this.feedbackAnalyticsService = feedbackAnalyticsService;
        this.feedbackAiService = feedbackAiService;
    }

    /**
     * Search, filter, and paginate tickets across all 4 roles (ADMIN, PHARMACIST, STAFF, SUPPLIER).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<FeedbackTicket>>> getAllTickets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sourceRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<FeedbackTicket> result = feedbackService.getAllTickets(search, category, priority, status, sourceRole, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Comprehensive feedback analytics & KPI metrics based on actual MariaDB records.
     */
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<FeedbackAnalyticsDto>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.ok(feedbackAnalyticsService.getAnalytics()));
    }

    /**
     * Update ticket status (e.g. UNDER_REVIEW, IN_PROGRESS, RESOLVED, CLOSED, REJECTED).
     */
    @PutMapping("/{ticketId}/status")
    public ResponseEntity<ApiResponse<FeedbackTicket>> updateStatus(
            @PathVariable Integer ticketId,
            @Valid @RequestBody UpdateStatusRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackTicket updated = feedbackService.updateStatus(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Ticket status updated to " + updated.getStatus(), updated));
    }

    /**
     * Update ticket priority (LOW, MEDIUM, HIGH, CRITICAL).
     */
    @PutMapping("/{ticketId}/priority")
    public ResponseEntity<ApiResponse<FeedbackTicket>> updatePriority(
            @PathVariable Integer ticketId,
            @Valid @RequestBody UpdatePriorityRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackTicket updated = feedbackService.updatePriority(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Ticket priority updated to " + updated.getPriority(), updated));
    }

    /**
     * Assign ticket to a pharmacist or staff member with optional resolution deadline.
     */
    @PutMapping("/{ticketId}/assign")
    public ResponseEntity<ApiResponse<FeedbackTicket>> assignTicket(
            @PathVariable Integer ticketId,
            @Valid @RequestBody AssignTicketRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackTicket updated = feedbackService.assignTicket(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Ticket assigned successfully.", updated));
    }

    /**
     * Mark ticket as RESOLVED with resolution notes.
     */
    @PostMapping("/{ticketId}/resolve")
    public ResponseEntity<ApiResponse<FeedbackTicket>> resolveTicket(
            @PathVariable Integer ticketId,
            @Valid @RequestBody ResolveTicketRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackTicket updated = feedbackService.resolveTicket(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Ticket marked as RESOLVED.", updated));
    }

    /**
     * Add private administrative internal note (never visible to non-admin roles).
     */
    @PostMapping("/{ticketId}/internal-notes")
    public ResponseEntity<ApiResponse<FeedbackInternalNote>> addInternalNote(
            @PathVariable Integer ticketId,
            @Valid @RequestBody AddInternalNoteRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackInternalNote note = feedbackService.addInternalNote(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Internal administrative note saved.", note));
    }

    /**
     * List internal administrative notes for a ticket.
     */
    @GetMapping("/{ticketId}/internal-notes")
    public ResponseEntity<ApiResponse<List<FeedbackInternalNote>>> getInternalNotes(@PathVariable Integer ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.getInternalNotes(ticketId)));
    }

    /**
     * AI-Powered ticket triage and recommendation insights.
     */
    @GetMapping("/{ticketId}/ai-insights")
    public ResponseEntity<ApiResponse<AiFeedbackInsightDto>> getAiInsights(@PathVariable Integer ticketId) {
        FeedbackTicketDetailDto details = feedbackService.getTicketDetails(ticketId);
        AiFeedbackInsightDto insights = feedbackAiService.analyzeFeedback(
                details.getTicket().getTitle(),
                details.getTicket().getDescription(),
                details.getTicket().getSourceRole()
        );
        return ResponseEntity.ok(ApiResponse.ok(insights));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleSecurity(SecurityException ex) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }
}

