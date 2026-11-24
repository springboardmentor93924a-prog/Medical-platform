package com.medistock.medistock.service;

import com.medistock.medistock.dto.feedback.AiFeedbackInsightDto;
import com.medistock.medistock.entity.FeedbackTicket;
import com.medistock.medistock.repository.FeedbackTicketRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class FeedbackAiService {

    private final FeedbackTicketRepository feedbackTicketRepository;

    private static final Set<String> CRITICAL_KEYWORDS = Set.of(
            "urgent", "critical", "emergency", "danger", "hazardous", "fatal",
            "leak", "soaked", "contamination", "spoiled", "poison", "life-threatening", "recall"
    );

    private static final Set<String> HIGH_KEYWORDS = Set.of(
            "mismatch", "discrepancy", "shortage", "missing", "delay", "expired",
            "delayed", "failure", "blocked", "broken", "unusable", "damage", "corrupted"
    );

    private static final Set<String> LOW_KEYWORDS = Set.of(
            "suggestion", "enhancement", "feature", "color", "cosmetic", "typo", "minor", "nice to have"
    );

    private static final Set<String> NEGATIVE_WORDS = Set.of(
            "problem", "issue", "error", "failed", "broken", "wrong", "mismatch",
            "frustrated", "delay", "damaged", "unacceptable", "terrible", "bad", "complaint"
    );

    private static final Set<String> POSITIVE_WORDS = Set.of(
            "thank", "good", "great", "excellent", "improved", "helpful", "appreciate", "resolved", "working"
    );

    public FeedbackAiService(FeedbackTicketRepository feedbackTicketRepository) {
        this.feedbackTicketRepository = feedbackTicketRepository;
    }

    /**
     * Performs AI analysis on title, description, and source role.
     */
    public AiFeedbackInsightDto analyzeFeedback(String title, String description, String sourceRole) {
        String combined = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase();

        AiFeedbackInsightDto dto = new AiFeedbackInsightDto();

        // 1. Categorization recommendation
        String category = recommendCategory(combined, sourceRole);
        dto.setRecommendedCategory(category);

        // 2. Priority recommendation
        PriorityResult priorityResult = recommendPriority(combined);
        dto.setRecommendedPriority(priorityResult.priority);
        dto.setPriorityReason(priorityResult.reason);

        // 3. Sentiment analysis
        SentimentResult sentiment = calculateSentiment(combined);
        dto.setSentimentScore(sentiment.score);
        dto.setSentimentLabel(sentiment.label);

        // 4. Summarization
        dto.setSummary(generateSummary(title, description, category, priorityResult.priority));

        // 5. Suggested Admin Reply
        dto.setSuggestedAdminReply(generateSuggestedReply(category, priorityResult.priority, sourceRole));

        // 6. Duplicate detection against active tickets in DB
        List<String> duplicates = detectDuplicates(title, combined);
        dto.setDuplicateCandidates(duplicates);

        dto.setConfidence(0.88);
        return dto;
    }

    private String recommendCategory(String text, String sourceRole) {
        if (text.contains("transit") || text.contains("carrier") || text.contains("traffic") ||
            text.contains("truck") || text.contains("supplier") || text.contains("dock delivery") || "SUPPLIER".equalsIgnoreCase(sourceRole)) {
            if (text.contains("delay") || text.contains("delivery") || text.contains("shipment")) {
                return "Supplier Issues";
            }
        }
        if (text.contains("fefo") || text.contains("first expiry") || text.contains("near expiry") || text.contains("expiring")) {
            return "FEFO Issues";
        }
        if (text.contains("wastage") || text.contains("damaged") || text.contains("soaked") || text.contains("broken carton") || text.contains("spill")) {
            return "Wastage Management Issues";
        }
        if (text.contains("discrepancy") || text.contains("physical count") || text.contains("quantity") || text.contains("inventory") || text.contains("stock")) {
            return "Inventory Issues";
        }
        if (text.contains("purchase order") || text.contains("po-") || text.contains("order quantity")) {
            return "Purchase Order Issues";
        }
        if (text.contains("password") || text.contains("login") || text.contains("unauthorized") || text.contains("access denied")) {
            return "Login and Authentication Problems";
        }
        if (text.contains("crash") || text.contains("bug") || text.contains("exception") || text.contains("error 500") || text.contains("slow")) {
            return "Technical Problems";
        }
        if (text.contains("feature") || text.contains("request") || text.contains("suggest") || text.contains("would be nice")) {
            return "Feature Requests";
        }
        if (text.contains("suggestion") || text.contains("idea") || text.contains("recommend")) {
            return "General Suggestions";
        }
        return "Medicine Management Issues";
    }

    private PriorityResult recommendPriority(String text) {
        for (String word : CRITICAL_KEYWORDS) {
            if (text.contains(word)) {
                return new PriorityResult("CRITICAL", "Flagged critical due to high-risk keywords detected: '" + word + "'. Requires immediate investigation.");
            }
        }
        for (String word : HIGH_KEYWORDS) {
            if (text.contains(word)) {
                return new PriorityResult("HIGH", "Flagged high priority due to operational impact keyword: '" + word + "'.");
            }
        }
        for (String word : LOW_KEYWORDS) {
            if (text.contains(word)) {
                return new PriorityResult("LOW", "Identified as routine suggestion or low-impact enhancement request.");
            }
        }
        return new PriorityResult("MEDIUM", "Standard business operational priority based on scope and language.");
    }

    private SentimentResult calculateSentiment(String text) {
        long negCount = Arrays.stream(text.split("\\W+")).filter(NEGATIVE_WORDS::contains).count();
        long posCount = Arrays.stream(text.split("\\W+")).filter(POSITIVE_WORDS::contains).count();

        boolean urgent = text.contains("urgent") || text.contains("immediate") || text.contains("critical");

        double score = 0.0;
        long total = negCount + posCount;
        if (total > 0) {
            score = (double) (posCount - negCount) / total;
        }

        String label;
        if (urgent && score < 0) {
            label = "URGENT_FRUSTRATED";
        } else if (score < -0.2) {
            label = "NEGATIVE";
        } else if (score > 0.2) {
            label = "POSITIVE";
        } else {
            label = "NEUTRAL";
        }

        return new SentimentResult(score, label);
    }

    private String generateSummary(String title, String description, String category, String priority) {
        String cleanTitle = title != null ? title.trim() : "Feedback Submission";
        return String.format("[%s Priority - %s] %s. Issue reported for review and triage by hospital administration.",
                priority, category, cleanTitle);
    }

    private String generateSuggestedReply(String category, String priority, String sourceRole) {
        String salutation = "SUPPLIER".equalsIgnoreCase(sourceRole) ? "Dear Supplier Partner," : "Hello,";
        if ("CRITICAL".equalsIgnoreCase(priority)) {
            return String.format("%s Thank you for escalating this critical issue. We have immediately initiated an urgent investigation with the hospital management and warehouse team. We will update you with corrective actions shortly.", salutation);
        } else if ("Inventory Issues".equalsIgnoreCase(category)) {
            return String.format("%s Thank you for reporting this stock discrepancy. Our pharmacy inventory control team has been assigned to perform a physical cycle recount and reconcile the system batch records.", salutation);
        } else if ("Supplier Issues".equalsIgnoreCase(category)) {
            return String.format("%s Thank you for the delivery and transit update. The receiving dock has been notified of the adjusted schedule.", salutation);
        } else {
            return String.format("%s Thank you for submitting your feedback regarding %s. The administrative team has reviewed your note and logged it for resolution.", salutation, category);
        }
    }

    private List<String> detectDuplicates(String title, String fullText) {
        if (title == null || title.isBlank()) return Collections.emptyList();
        Set<String> queryWords = extractSignificantWords(title);
        if (queryWords.isEmpty()) return Collections.emptyList();

        List<FeedbackTicket> active = feedbackTicketRepository.findActiveTickets();
        List<String> matches = new ArrayList<>();

        for (FeedbackTicket t : active) {
            Set<String> candidateWords = extractSignificantWords(t.getTitle());
            long intersection = queryWords.stream().filter(candidateWords::contains).count();
            double jaccard = (double) intersection / (queryWords.size() + candidateWords.size() - intersection);
            if (jaccard >= 0.35) {
                matches.add(t.getTicketNumber() + ": " + t.getTitle());
            }
        }
        return matches;
    }

    private Set<String> extractSignificantWords(String text) {
        Pattern pattern = Pattern.compile("\\b[a-zA-Z]{3,}\\b");
        return pattern.matcher(text.toLowerCase())
                .results()
                .map(m -> m.group())
                .filter(w -> !Set.of("the", "and", "for", "with", "this", "that", "from", "report", "issue", "problem").contains(w))
                .collect(Collectors.toSet());
    }

    private static class PriorityResult {
        final String priority;
        final String reason;
        PriorityResult(String priority, String reason) {
            this.priority = priority;
            this.reason = reason;
        }
    }

    private static class SentimentResult {
        final double score;
        final String label;
        SentimentResult(double score, String label) {
            this.score = score;
            this.label = label;
        }
    }
}

