package com.medistock.medistock.service;

import com.medistock.medistock.dto.feedback.FeedbackAnalyticsDto;
import com.medistock.medistock.repository.FeedbackRatingRepository;
import com.medistock.medistock.repository.FeedbackTicketRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FeedbackAnalyticsService {

    private final FeedbackTicketRepository feedbackTicketRepository;
    private final FeedbackRatingRepository feedbackRatingRepository;

    public FeedbackAnalyticsService(FeedbackTicketRepository feedbackTicketRepository,
                                    FeedbackRatingRepository feedbackRatingRepository) {
        this.feedbackTicketRepository = feedbackTicketRepository;
        this.feedbackRatingRepository = feedbackRatingRepository;
    }

    public FeedbackAnalyticsDto getAnalytics() {
        FeedbackAnalyticsDto dto = new FeedbackAnalyticsDto();

        long total = feedbackTicketRepository.count();
        dto.setTotalTickets(total);

        long submitted = feedbackTicketRepository.countByStatus("SUBMITTED");
        long underReview = feedbackTicketRepository.countByStatus("UNDER_REVIEW");
        dto.setPendingTickets(submitted + underReview);

        long assigned = feedbackTicketRepository.countByStatus("ASSIGNED");
        long inProgress = feedbackTicketRepository.countByStatus("IN_PROGRESS");
        long waiting = feedbackTicketRepository.countByStatus("WAITING_FOR_INFORMATION");
        dto.setInProgressTickets(assigned + inProgress + waiting);

        long resolved = feedbackTicketRepository.countByStatus("RESOLVED");
        long closed = feedbackTicketRepository.countByStatus("CLOSED");
        dto.setResolvedTickets(resolved + closed);

        dto.setCriticalTickets(feedbackTicketRepository.countByPriority("CRITICAL"));
        dto.setReopenedTickets(feedbackTicketRepository.countByStatus("REOPENED"));

        Double avgHours = feedbackTicketRepository.getAverageResolutionTimeHours();
        dto.setAverageResolutionTimeHours(avgHours != null ? Math.round(avgHours * 10.0) / 10.0 : 0.0);

        Double avgRating = feedbackRatingRepository.getAverageRating();
        dto.setAverageSatisfactionRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        dto.setTotalRatingsCount(feedbackRatingRepository.count());

        double resolvedPct = total > 0 ? (double) (resolved + closed) / total * 100.0 : 0.0;
        dto.setResolvedPercentage(Math.round(resolvedPct * 10.0) / 10.0);

        // Groupings
        dto.setTicketsByRole(toMap(feedbackTicketRepository.countByRole()));
        dto.setTicketsByCategory(toMap(feedbackTicketRepository.countByCategory()));
        dto.setTicketsByStatus(toMap(feedbackTicketRepository.countByStatusGroup()));
        dto.setTicketsByPriority(toMap(feedbackTicketRepository.countByPriorityGroup()));

        return dto;
    }

    private Map<String, Long> toMap(List<Object[]> rows) {
        Map<String, Long> map = new LinkedHashMap<>();
        if (rows != null) {
            for (Object[] r : rows) {
                if (r.length >= 2 && r[0] != null) {
                    map.put(r[0].toString(), ((Number) r[1]).longValue());
                }
            }
        }
        return map;
    }
}

