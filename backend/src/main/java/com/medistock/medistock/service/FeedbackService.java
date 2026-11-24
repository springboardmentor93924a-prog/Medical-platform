package com.medistock.medistock.service;

import com.medistock.medistock.dto.feedback.*;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

    private final FeedbackTicketRepository feedbackTicketRepository;
    private final FeedbackMessageRepository feedbackMessageRepository;
    private final FeedbackAttachmentRepository feedbackAttachmentRepository;
    private final FeedbackStatusHistoryRepository feedbackStatusHistoryRepository;
    private final FeedbackRatingRepository feedbackRatingRepository;
    private final FeedbackInternalNoteRepository feedbackInternalNoteRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final FeedbackAiService feedbackAiService;

    @Value("${medistock.feedback.storage-dir:./storage/feedback}")
    private String storageDir;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "pdf", "txt", "csv", "doc", "docx", "webp"
    );

    public FeedbackService(FeedbackTicketRepository feedbackTicketRepository,
                           FeedbackMessageRepository feedbackMessageRepository,
                           FeedbackAttachmentRepository feedbackAttachmentRepository,
                           FeedbackStatusHistoryRepository feedbackStatusHistoryRepository,
                           FeedbackRatingRepository feedbackRatingRepository,
                           FeedbackInternalNoteRepository feedbackInternalNoteRepository,
                           UserRepository userRepository,
                           CurrentUserService currentUserService,
                           NotificationService notificationService,
                           AuditService auditService,
                           FeedbackAiService feedbackAiService) {
        this.feedbackTicketRepository = feedbackTicketRepository;
        this.feedbackMessageRepository = feedbackMessageRepository;
        this.feedbackAttachmentRepository = feedbackAttachmentRepository;
        this.feedbackStatusHistoryRepository = feedbackStatusHistoryRepository;
        this.feedbackRatingRepository = feedbackRatingRepository;
        this.feedbackInternalNoteRepository = feedbackInternalNoteRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.feedbackAiService = feedbackAiService;
    }

    /**
     * Submit new feedback ticket (available to Admin, Pharmacist, Staff, Supplier).
     */
    @Transactional
    public FeedbackTicket createTicket(CreateFeedbackRequest req, MultipartFile file, HttpServletRequest httpReq) {
        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("User session context required to submit feedback."));

        String role = normalizeRole(currentUser);

        // Generate unique ticket ID: MED-FB-000001
        Integer maxId = feedbackTicketRepository.findMaxTicketId();
        int nextSeq = (maxId != null ? maxId : 0) + 1;
        String ticketNumber = String.format("MED-FB-%06d", nextSeq);

        // If priority is not specified or default, consult AI heuristic
        String priority = req.getPriority();
        if (priority == null || priority.isBlank() || "MEDIUM".equalsIgnoreCase(priority)) {
            AiFeedbackInsightDto ai = feedbackAiService.analyzeFeedback(req.getTitle(), req.getDescription(), role);
            if (ai.getRecommendedPriority() != null) {
                priority = ai.getRecommendedPriority();
            }
        }

        FeedbackTicket ticket = new FeedbackTicket();
        ticket.setTicketNumber(ticketNumber);
        ticket.setTitle(req.getTitle().trim());
        ticket.setDescription(req.getDescription().trim());
        ticket.setCategory(req.getCategory().trim());
        ticket.setPriority(priority.toUpperCase());
        ticket.setStatus("SUBMITTED");
        ticket.setSubmittedBy(currentUser.getUserId());
        ticket.setSourceRole(role);
        ticket.setRelatedModule(req.getRelatedModule());
        ticket.setCreatedAt(LocalDateTime.now().withNano(0));

        FeedbackTicket savedTicket = feedbackTicketRepository.save(ticket);

        // Record initial message
        FeedbackMessage initialMsg = new FeedbackMessage();
        initialMsg.setTicketId(savedTicket.getTicketId());
        initialMsg.setSenderId(currentUser.getUserId());
        initialMsg.setMessage(req.getDescription().trim());
        initialMsg.setMessageType("USER_MESSAGE");
        initialMsg.setCreatedAt(LocalDateTime.now().withNano(0));
        FeedbackMessage savedMsg = feedbackMessageRepository.save(initialMsg);

        // Optional file attachment
        if (file != null && !file.isEmpty()) {
            saveAttachment(savedTicket.getTicketId(), savedMsg.getMessageId(), file, currentUser.getUserId());
        }

        // Record initial status history
        FeedbackStatusHistory hist = new FeedbackStatusHistory();
        hist.setTicketId(savedTicket.getTicketId());
        hist.setOldStatus(null);
        hist.setNewStatus("SUBMITTED");
        hist.setChangedBy(currentUser.getUserId());
        hist.setChangeReason("Ticket created by " + currentUser.getFullName() + " (" + role + ")");
        hist.setChangedAt(LocalDateTime.now().withNano(0));
        feedbackStatusHistoryRepository.save(hist);

        // Audit Log
        auditService.logEvent(
                currentUser.getUserId(),
                role,
                "CREATE_FEEDBACK_TICKET",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                savedTicket.getTicketId(),
                null,
                Map.of("ticketNumber", ticketNumber, "category", savedTicket.getCategory(), "priority", savedTicket.getPriority()),
                "Submitted feedback ticket " + ticketNumber + ": " + savedTicket.getTitle(),
                "SUCCESS",
                httpReq
        );

        // Notify Admins
        notifyAdmins(
                "New " + role + " Feedback: " + ticketNumber,
                "User " + currentUser.getFullName() + " submitted: " + savedTicket.getTitle(),
                "FEEDBACK",
                savedTicket.getTicketId(),
                "CRITICAL".equalsIgnoreCase(savedTicket.getPriority()) ? "CRITICAL" : "NORMAL"
        );

        return savedTicket;
    }

    /**
     * Get tickets owned by or assigned to the current user.
     */
    public List<FeedbackTicket> getMyTickets() {
        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Authentication context required"));
        return feedbackTicketRepository.findBySubmittedByOrAssignedToOrderByCreatedAtDesc(
                currentUser.getUserId(), currentUser.getUserId()
        );
    }

    /**
     * Admin view: Search and filter across all roles.
     */
    public Page<FeedbackTicket> getAllTickets(String search, String category, String priority,
                                            String status, String sourceRole, Pageable pageable) {
        Specification<FeedbackTicket> spec = (root, query, cb) -> cb.conjunction();

        if (search != null && !search.isBlank()) {
            String q = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("ticketNumber")), q),
                    cb.like(cb.lower(root.get("title")), q),
                    cb.like(cb.lower(root.get("description")), q)
            ));
        }

        if (category != null && !category.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category.trim()));
        }

        if (priority != null && !priority.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority.trim().toUpperCase()));
        }

        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status.trim().toUpperCase()));
        }

        if (sourceRole != null && !sourceRole.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("sourceRole"), sourceRole.trim().toUpperCase()));
        }

        return feedbackTicketRepository.findAll(spec, pageable);
    }

    /**
     * Get ticket details with role-based access validation.
     */
    public FeedbackTicketDetailDto getTicketDetails(Integer ticketId) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback ticket not found with ID: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Authentication context required"));

        boolean isAdmin = isAdmin(currentUser);
        boolean isOwner = currentUser.getUserId().equals(ticket.getSubmittedBy());
        boolean isAssignee = currentUser.getUserId().equals(ticket.getAssignedTo());

        if (!isAdmin && !isOwner && !isAssignee) {
            throw new SecurityException("Access denied: You are not authorized to view ticket " + ticket.getTicketNumber());
        }

        FeedbackTicketDetailDto dto = new FeedbackTicketDetailDto();
        dto.setTicket(ticket);
        dto.setMessages(feedbackMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId));
        dto.setAttachments(feedbackAttachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId));
        dto.setStatusHistory(feedbackStatusHistoryRepository.findByTicketIdOrderByChangedAtAsc(ticketId));
        dto.setRating(feedbackRatingRepository.findByTicketId(ticketId).orElse(null));

        // Internal notes are STRICTLY visible to Administrators only
        if (isAdmin) {
            dto.setInternalNotes(feedbackInternalNoteRepository.findByTicketIdOrderByCreatedAtDesc(ticketId));
            dto.setAiInsights(feedbackAiService.analyzeFeedback(ticket.getTitle(), ticket.getDescription(), ticket.getSourceRole()));
        }

        return dto;
    }

    /**
     * Send a message on a ticket.
     */
    @Transactional
    public FeedbackMessage addMessage(Integer ticketId, AddMessageRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Authentication context required"));

        boolean isAdmin = isAdmin(currentUser);
        boolean isOwner = currentUser.getUserId().equals(ticket.getSubmittedBy());
        boolean isAssignee = currentUser.getUserId().equals(ticket.getAssignedTo());

        if (!isAdmin && !isOwner && !isAssignee) {
            throw new SecurityException("Access denied to conversation on ticket " + ticket.getTicketNumber());
        }

        String msgType = isAdmin ? "ADMIN_RESPONSE" : "USER_MESSAGE";

        FeedbackMessage msg = new FeedbackMessage();
        msg.setTicketId(ticketId);
        msg.setSenderId(currentUser.getUserId());
        msg.setMessage(req.getMessage().trim());
        msg.setMessageType(msgType);
        msg.setCreatedAt(LocalDateTime.now().withNano(0));

        FeedbackMessage savedMsg = feedbackMessageRepository.save(msg);

        // If Admin replied and ticket was SUBMITTED, transition to UNDER_REVIEW automatically
        if (isAdmin && "SUBMITTED".equals(ticket.getStatus())) {
            ticket.setStatus("UNDER_REVIEW");
            ticket.setUpdatedAt(LocalDateTime.now().withNano(0));
            feedbackTicketRepository.save(ticket);

            FeedbackStatusHistory hist = new FeedbackStatusHistory();
            hist.setTicketId(ticketId);
            hist.setOldStatus("SUBMITTED");
            hist.setNewStatus("UNDER_REVIEW");
            hist.setChangedBy(currentUser.getUserId());
            hist.setChangeReason("Status progressed to UNDER_REVIEW upon Admin response");
            hist.setChangedAt(LocalDateTime.now().withNano(0));
            feedbackStatusHistoryRepository.save(hist);
        }

        // Notify counterpart
        if (isAdmin) {
            notificationService.sendNotification(
                    ticket.getSubmittedBy(),
                    "Admin Response on " + ticket.getTicketNumber(),
                    currentUser.getFullName() + " replied: " + truncate(req.getMessage(), 120),
                    "FEEDBACK_REPLY",
                    "FEEDBACK_TICKET",
                    ticketId,
                    "NORMAL"
            );
        } else {
            notifyAdmins(
                    "User Response on " + ticket.getTicketNumber(),
                    currentUser.getFullName() + " replied: " + truncate(req.getMessage(), 120),
                    "FEEDBACK_REPLY",
                    ticketId,
                    "NORMAL"
            );
        }

        return savedMsg;
    }

    /**
     * Upload an attachment to a ticket.
     */
    @Transactional
    public FeedbackAttachment uploadAttachment(Integer ticketId, MultipartFile file, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Authentication context required"));

        return saveAttachment(ticketId, null, file, currentUser.getUserId());
    }

    /**
     * Admin: Update ticket status.
     */
    @Transactional
    public FeedbackTicket updateStatus(Integer ticketId, UpdateStatusRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Admin authorization required"));

        String oldStatus = ticket.getStatus();
        String newStatus = req.getStatus().trim().toUpperCase();

        if (oldStatus.equals(newStatus)) {
            return ticket;
        }

        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now().withNano(0));

        if ("RESOLVED".equals(newStatus)) {
            ticket.setResolvedAt(LocalDateTime.now().withNano(0));
        } else if ("CLOSED".equals(newStatus) || "REJECTED".equals(newStatus)) {
            ticket.setClosedAt(LocalDateTime.now().withNano(0));
        }

        FeedbackTicket updated = feedbackTicketRepository.save(ticket);

        FeedbackStatusHistory hist = new FeedbackStatusHistory();
        hist.setTicketId(ticketId);
        hist.setOldStatus(oldStatus);
        hist.setNewStatus(newStatus);
        hist.setChangedBy(currentUser.getUserId());
        hist.setChangeReason(req.getReason() != null ? req.getReason() : "Status updated by Admin");
        hist.setChangedAt(LocalDateTime.now().withNano(0));
        feedbackStatusHistoryRepository.save(hist);

        auditService.logEvent(
                currentUser.getUserId(),
                "ADMIN",
                "UPDATE_FEEDBACK_STATUS",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                ticketId,
                Map.of("oldStatus", oldStatus),
                Map.of("newStatus", newStatus, "reason", hist.getChangeReason()),
                "Changed status of " + ticket.getTicketNumber() + " to " + newStatus,
                "SUCCESS",
                httpReq
        );

        // Notify submitter
        notificationService.sendNotification(
                ticket.getSubmittedBy(),
                "Ticket " + ticket.getTicketNumber() + " Status: " + newStatus,
                "Your ticket status was updated to " + newStatus + (req.getReason() != null ? " (" + req.getReason() + ")" : ""),
                "FEEDBACK_STATUS",
                "FEEDBACK_TICKET",
                ticketId,
                "NORMAL"
        );

        return updated;
    }

    /**
     * Admin: Update ticket priority.
     */
    @Transactional
    public FeedbackTicket updatePriority(Integer ticketId, UpdatePriorityRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Admin authorization required"));

        String oldPriority = ticket.getPriority();
        String newPriority = req.getPriority().trim().toUpperCase();

        ticket.setPriority(newPriority);
        ticket.setUpdatedAt(LocalDateTime.now().withNano(0));
        FeedbackTicket updated = feedbackTicketRepository.save(ticket);

        auditService.logEvent(
                currentUser.getUserId(),
                "ADMIN",
                "UPDATE_FEEDBACK_PRIORITY",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                ticketId,
                Map.of("oldPriority", oldPriority),
                Map.of("newPriority", newPriority, "reason", req.getReason() != null ? req.getReason() : "Manual priority adjustment"),
                "Changed priority of " + ticket.getTicketNumber() + " to " + newPriority,
                "SUCCESS",
                httpReq
        );

        return updated;
    }

    /**
     * Admin: Assign ticket to staff or pharmacist with deadline.
     */
    @Transactional
    public FeedbackTicket assignTicket(Integer ticketId, AssignTicketRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Admin authorization required"));

        User assignee = userRepository.findById(req.getAssignedTo())
                .orElseThrow(() -> new IllegalArgumentException("Assigned user ID not found: " + req.getAssignedTo()));

        ticket.setAssignedTo(assignee.getUserId());
        ticket.setDeadlineAt(req.getDeadlineAt());
        ticket.setStatus("ASSIGNED");
        ticket.setUpdatedAt(LocalDateTime.now().withNano(0));

        FeedbackTicket updated = feedbackTicketRepository.save(ticket);

        // Record history
        FeedbackStatusHistory hist = new FeedbackStatusHistory();
        hist.setTicketId(ticketId);
        hist.setOldStatus(ticket.getStatus());
        hist.setNewStatus("ASSIGNED");
        hist.setChangedBy(currentUser.getUserId());
        hist.setChangeReason("Assigned to " + assignee.getFullName() + (req.getAssignmentNote() != null ? ": " + req.getAssignmentNote() : ""));
        hist.setChangedAt(LocalDateTime.now().withNano(0));
        feedbackStatusHistoryRepository.save(hist);

        // Notify assigned user
        notificationService.sendNotification(
                assignee.getUserId(),
                "Assigned to Ticket " + ticket.getTicketNumber(),
                "Admin " + currentUser.getFullName() + " assigned you: " + ticket.getTitle(),
                "FEEDBACK_ASSIGNED",
                "FEEDBACK_TICKET",
                ticketId,
                "HIGH"
        );

        auditService.logEvent(
                currentUser.getUserId(),
                "ADMIN",
                "ASSIGN_FEEDBACK_TICKET",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                ticketId,
                null,
                Map.of("assignedTo", assignee.getUserId(), "assigneeName", assignee.getFullName()),
                "Assigned " + ticket.getTicketNumber() + " to " + assignee.getFullName(),
                "SUCCESS",
                httpReq
        );

        return updated;
    }

    /**
     * Admin: Mark ticket resolved with notes.
     */
    @Transactional
    public FeedbackTicket resolveTicket(Integer ticketId, ResolveTicketRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Admin authorization required"));

        ticket.setStatus("RESOLVED");
        ticket.setResolutionNotes(req.getResolutionNotes().trim());
        ticket.setResolvedAt(LocalDateTime.now().withNano(0));
        ticket.setUpdatedAt(LocalDateTime.now().withNano(0));

        FeedbackTicket updated = feedbackTicketRepository.save(ticket);

        // System message in conversation
        FeedbackMessage resolveMsg = new FeedbackMessage();
        resolveMsg.setTicketId(ticketId);
        resolveMsg.setSenderId(currentUser.getUserId());
        resolveMsg.setMessage("TICKET RESOLVED: " + req.getResolutionNotes().trim());
        resolveMsg.setMessageType("SYSTEM_EVENT");
        resolveMsg.setCreatedAt(LocalDateTime.now().withNano(0));
        feedbackMessageRepository.save(resolveMsg);

        // Record history
        FeedbackStatusHistory hist = new FeedbackStatusHistory();
        hist.setTicketId(ticketId);
        hist.setOldStatus(ticket.getStatus());
        hist.setNewStatus("RESOLVED");
        hist.setChangedBy(currentUser.getUserId());
        hist.setChangeReason("Resolved: " + truncate(req.getResolutionNotes(), 200));
        hist.setChangedAt(LocalDateTime.now().withNano(0));
        feedbackStatusHistoryRepository.save(hist);

        // Notify submitter to verify and rate
        notificationService.sendNotification(
                ticket.getSubmittedBy(),
                "Ticket Resolved: " + ticket.getTicketNumber(),
                "Admin resolved your issue: " + truncate(req.getResolutionNotes(), 100) + ". Please confirm and submit your rating.",
                "FEEDBACK_RESOLVED",
                "FEEDBACK_TICKET",
                ticketId,
                "NORMAL"
        );

        auditService.logEvent(
                currentUser.getUserId(),
                "ADMIN",
                "RESOLVE_FEEDBACK_TICKET",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                ticketId,
                null,
                Map.of("resolutionNotes", req.getResolutionNotes()),
                "Resolved " + ticket.getTicketNumber(),
                "SUCCESS",
                httpReq
        );

        return updated;
    }

    /**
     * Submitter / Assignee: Rate resolution (1-5 stars) and confirm fix.
     */
    @Transactional
    public FeedbackRating submitRating(Integer ticketId, SubmitRatingRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Authentication context required"));

        if (!currentUser.getUserId().equals(ticket.getSubmittedBy()) && !isAdmin(currentUser)) {
            throw new SecurityException("Only the ticket submitter can submit satisfaction ratings.");
        }

        FeedbackRating rating = feedbackRatingRepository.findByTicketId(ticketId).orElse(new FeedbackRating());
        rating.setTicketId(ticketId);
        rating.setRatedBy(currentUser.getUserId());
        rating.setRating(req.getRating());
        rating.setComments(req.getComments());
        rating.setIssueResolved(req.getIssueResolved() != null ? req.getIssueResolved() : true);
        rating.setCreatedAt(LocalDateTime.now().withNano(0));

        FeedbackRating savedRating = feedbackRatingRepository.save(rating);

        // If user reported issue NOT resolved, automatically request reopening
        if (Boolean.FALSE.equals(req.getIssueResolved())) {
            ticket.setStatus("REOPENED");
            ticket.setReopenReason("User reported issue was NOT resolved during rating review: " + (req.getComments() != null ? req.getComments() : "No reason provided"));
            ticket.setUpdatedAt(LocalDateTime.now().withNano(0));
            feedbackTicketRepository.save(ticket);

            notifyAdmins(
                    "Ticket Reopened: " + ticket.getTicketNumber(),
                    "User indicated problem was not resolved. Rating: " + req.getRating() + "/5 stars.",
                    "FEEDBACK_REOPENED",
                    ticketId,
                    "HIGH"
            );
        } else {
            // If resolved and 4 or 5 stars, can close ticket
            ticket.setStatus("CLOSED");
            ticket.setClosedAt(LocalDateTime.now().withNano(0));
            ticket.setUpdatedAt(LocalDateTime.now().withNano(0));
            feedbackTicketRepository.save(ticket);
        }

        auditService.logEvent(
                currentUser.getUserId(),
                normalizeRole(currentUser),
                "RATE_FEEDBACK_RESOLUTION",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                ticketId,
                null,
                Map.of("rating", req.getRating(), "issueResolved", rating.getIssueResolved()),
                "Rated resolution for " + ticket.getTicketNumber() + ": " + req.getRating() + " stars",
                "SUCCESS",
                httpReq
        );

        return savedRating;
    }

    /**
     * Submitter or Admin: Reopen ticket with reason.
     */
    @Transactional
    public FeedbackTicket reopenTicket(Integer ticketId, ReopenTicketRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Authentication context required"));

        boolean isOwner = currentUser.getUserId().equals(ticket.getSubmittedBy());
        if (!isOwner && !isAdmin(currentUser)) {
            throw new SecurityException("Only the ticket creator or an administrator can reopen this ticket.");
        }

        String oldStatus = ticket.getStatus();
        ticket.setStatus("REOPENED");
        ticket.setReopenReason(req.getReopenReason().trim());
        ticket.setUpdatedAt(LocalDateTime.now().withNano(0));
        FeedbackTicket updated = feedbackTicketRepository.save(ticket);

        FeedbackStatusHistory hist = new FeedbackStatusHistory();
        hist.setTicketId(ticketId);
        hist.setOldStatus(oldStatus);
        hist.setNewStatus("REOPENED");
        hist.setChangedBy(currentUser.getUserId());
        hist.setChangeReason("Reopened: " + req.getReopenReason().trim());
        hist.setChangedAt(LocalDateTime.now().withNano(0));
        feedbackStatusHistoryRepository.save(hist);

        FeedbackMessage reopenMsg = new FeedbackMessage();
        reopenMsg.setTicketId(ticketId);
        reopenMsg.setSenderId(currentUser.getUserId());
        reopenMsg.setMessage("TICKET REOPENED: " + req.getReopenReason().trim());
        reopenMsg.setMessageType("SYSTEM_EVENT");
        reopenMsg.setCreatedAt(LocalDateTime.now().withNano(0));
        feedbackMessageRepository.save(reopenMsg);

        notifyAdmins(
                "Ticket Reopened: " + ticket.getTicketNumber(),
                currentUser.getFullName() + " reopened ticket: " + req.getReopenReason().trim(),
                "FEEDBACK_REOPENED",
                ticketId,
                "HIGH"
        );

        auditService.logEvent(
                currentUser.getUserId(),
                normalizeRole(currentUser),
                "REOPEN_FEEDBACK_TICKET",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                ticketId,
                Map.of("oldStatus", oldStatus),
                Map.of("newStatus", "REOPENED", "reopenReason", req.getReopenReason().trim()),
                "Reopened ticket " + ticket.getTicketNumber(),
                "SUCCESS",
                httpReq
        );

        return updated;
    }

    /**
     * Admin: Add confidential internal note.
     */
    @Transactional
    public FeedbackInternalNote addInternalNote(Integer ticketId, AddInternalNoteRequest req, HttpServletRequest httpReq) {
        FeedbackTicket ticket = feedbackTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Admin authorization required"));

        FeedbackInternalNote note = new FeedbackInternalNote();
        note.setTicketId(ticketId);
        note.setAdminId(currentUser.getUserId());
        note.setNote(req.getNote().trim());
        note.setCreatedAt(LocalDateTime.now().withNano(0));

        FeedbackInternalNote saved = feedbackInternalNoteRepository.save(note);

        auditService.logEvent(
                currentUser.getUserId(),
                "ADMIN",
                "ADD_FEEDBACK_INTERNAL_NOTE",
                "FEEDBACK_MANAGEMENT",
                "FEEDBACK_TICKET",
                ticketId,
                null,
                Map.of("noteId", saved.getNoteId()),
                "Added confidential administrative note to " + ticket.getTicketNumber(),
                "SUCCESS",
                httpReq
        );

        return saved;
    }

    /**
     * Admin: Get all internal notes for a ticket.
     */
    public List<FeedbackInternalNote> getInternalNotes(Integer ticketId) {
        return feedbackInternalNoteRepository.findByTicketIdOrderByCreatedAtDesc(ticketId);
    }

    /**
     * Secure attachment file download.
     */
    public File getAttachmentFile(Integer attachmentId) {
        FeedbackAttachment att = feedbackAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found: " + attachmentId));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new SecurityException("Authentication context required"));

        FeedbackTicket ticket = feedbackTicketRepository.findById(att.getTicketId())
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (!isAdmin(currentUser) && !currentUser.getUserId().equals(ticket.getSubmittedBy()) && !currentUser.getUserId().equals(ticket.getAssignedTo())) {
            throw new SecurityException("Unauthorized access to attachment.");
        }

        File file = new File(att.getStorageLocation());
        if (!file.exists()) {
            throw new IllegalStateException("Physical attachment file not found on disk.");
        }
        return file;
    }

    private FeedbackAttachment saveAttachment(Integer ticketId, Integer messageId, MultipartFile file, Integer userId) {
        try {
            String originalName = file.getOriginalFilename();
            if (originalName == null || originalName.isBlank()) originalName = "upload.bin";

            String ext = "";
            int dotIdx = originalName.lastIndexOf('.');
            if (dotIdx > 0) {
                ext = originalName.substring(dotIdx + 1).toLowerCase();
            }

            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new IllegalArgumentException("Unsupported file type: " + ext + ". Allowed: " + ALLOWED_EXTENSIONS);
            }

            if (file.getSize() > 15 * 1024 * 1024) {
                throw new IllegalArgumentException("Attachment file size exceeds maximum limit of 15MB.");
            }

            File dir = new File(storageDir);
            if (!dir.exists()) dir.mkdirs();

            String storedName = "FB_" + ticketId + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
            Path targetPath = Paths.get(storageDir, storedName);
            Files.copy(file.getInputStream(), targetPath);

            FeedbackAttachment att = new FeedbackAttachment();
            att.setTicketId(ticketId);
            att.setMessageId(messageId);
            att.setUploadedBy(userId);
            att.setOriginalFilename(originalName);
            att.setStoredFilename(storedName);
            att.setFileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            att.setFileSize(file.getSize());
            att.setStorageLocation(targetPath.toAbsolutePath().toString());
            att.setCreatedAt(LocalDateTime.now().withNano(0));

            return feedbackAttachmentRepository.save(att);
        } catch (IOException e) {
            log.error("Failed to store attachment file: {}", e.getMessage());
            throw new RuntimeException("Could not store feedback attachment: " + e.getMessage(), e);
        }
    }

    private void notifyAdmins(String title, String message, String entityType, Integer entityId, String priority) {
        List<User> admins = userRepository.findByRoleIdAndActiveTrue(1);
        for (User admin : admins) {
            try {
                notificationService.sendNotification(
                        admin.getUserId(),
                        title,
                        message,
                        "FEEDBACK_ADMIN_ALERT",
                        entityType,
                        entityId,
                        priority
                );
            } catch (Exception e) {
                log.warn("Failed sending notification to admin {}: {}", admin.getEmail(), e.getMessage());
            }
        }
    }

    private boolean isAdmin(User user) {
        return user.getRoleId() != null && user.getRoleId() == 1;
    }

    private String normalizeRole(User user) {
        if (user.getRoleId() == null) return "STAFF";
        return switch (user.getRoleId()) {
            case 1 -> "ADMIN";
            case 2 -> "PHARMACIST";
            case 3 -> "STAFF";
            case 4 -> "SUPPLIER";
            default -> "STAFF";
        };
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max - 3) + "...";
    }
}
