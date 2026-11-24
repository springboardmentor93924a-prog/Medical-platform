package com.medistock.medistock.controller;

import com.medistock.medistock.dto.ApiResponse;
import com.medistock.medistock.dto.feedback.*;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.service.FeedbackAiService;
import com.medistock.medistock.service.FeedbackService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final FeedbackAiService feedbackAiService;

    public FeedbackController(FeedbackService feedbackService, FeedbackAiService feedbackAiService) {
        this.feedbackService = feedbackService;
        this.feedbackAiService = feedbackAiService;
    }

    /**
     * Submit new feedback ticket (with optional attachment file).
     */
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE })
    public ResponseEntity<ApiResponse<FeedbackTicket>> createTicket(
            @RequestPart("feedback") @Valid CreateFeedbackRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest httpServletRequest) {
        FeedbackTicket ticket = feedbackService.createTicket(request, file, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Feedback ticket submitted successfully.", ticket));
    }

    /**
     * JSON payload convenience endpoint for feedback submission without immediate file attachment.
     */
    @PostMapping(value = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<FeedbackTicket>> createTicketJson(
            @Valid @RequestBody CreateFeedbackRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackTicket ticket = feedbackService.createTicket(request, null, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Feedback ticket submitted successfully.", ticket));
    }

    /**
     * Get tickets submitted by or assigned to the authenticated user.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<FeedbackTicket>>> getMyTickets() {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.getMyTickets()));
    }

    /**
     * Get ticket details with role-based security checks.
     */
    @GetMapping("/{ticketId}")
    public ResponseEntity<ApiResponse<FeedbackTicketDetailDto>> getTicketDetails(@PathVariable Integer ticketId) {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.getTicketDetails(ticketId)));
    }

    /**
     * Send message on ticket conversation.
     */
    @PostMapping("/{ticketId}/messages")
    public ResponseEntity<ApiResponse<FeedbackMessage>> addMessage(
            @PathVariable Integer ticketId,
            @Valid @RequestBody AddMessageRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackMessage msg = feedbackService.addMessage(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Message sent successfully.", msg));
    }

    /**
     * Upload an attachment to an existing ticket.
     */
    @PostMapping(value = "/{ticketId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FeedbackAttachment>> uploadAttachment(
            @PathVariable Integer ticketId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest httpServletRequest) {
        FeedbackAttachment attachment = feedbackService.uploadAttachment(ticketId, file, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Attachment uploaded successfully.", attachment));
    }

    /**
     * Download attachment file securely.
     */
    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Integer attachmentId) {
        File file = feedbackService.getAttachmentFile(attachmentId);
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .body(resource);
    }

    /**
     * Rate resolution satisfaction (1 to 5 stars).
     */
    @PostMapping("/{ticketId}/rating")
    public ResponseEntity<ApiResponse<FeedbackRating>> submitRating(
            @PathVariable Integer ticketId,
            @Valid @RequestBody SubmitRatingRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackRating rating = feedbackService.submitRating(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Feedback rating submitted.", rating));
    }

    /**
     * Request reopening of a ticket with reason.
     */
    @PostMapping("/{ticketId}/reopen")
    public ResponseEntity<ApiResponse<FeedbackTicket>> reopenTicket(
            @PathVariable Integer ticketId,
            @Valid @RequestBody ReopenTicketRequest request,
            HttpServletRequest httpServletRequest) {
        FeedbackTicket ticket = feedbackService.reopenTicket(ticketId, request, httpServletRequest);
        return ResponseEntity.ok(ApiResponse.ok("Ticket reopened for investigation.", ticket));
    }

    /**
     * AI-Powered draft analysis: previews category, priority, and sentiment before submission.
     */
    @PostMapping("/ai/analyze-draft")
    public ResponseEntity<ApiResponse<AiFeedbackInsightDto>> analyzeDraft(
            @RequestBody CreateFeedbackRequest draft,
            HttpServletRequest httpServletRequest) {
        AiFeedbackInsightDto insights = feedbackAiService.analyzeFeedback(
                draft.getTitle(), draft.getDescription(), draft.getCategory()
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

