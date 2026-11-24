package com.medistock.medistock.dto.feedback;

import java.util.Map;

public class FeedbackAnalyticsDto {

    private long totalTickets;
    private long pendingTickets;
    private long inProgressTickets;
    private long resolvedTickets;
    private long criticalTickets;
    private long reopenedTickets;
    private double averageResolutionTimeHours;
    private double averageSatisfactionRating;
    private long totalRatingsCount;
    private double resolvedPercentage;

    private Map<String, Long> ticketsByRole;
    private Map<String, Long> ticketsByCategory;
    private Map<String, Long> ticketsByStatus;
    private Map<String, Long> ticketsByPriority;

    public FeedbackAnalyticsDto() {
    }

    public long getTotalTickets() {
        return totalTickets;
    }

    public void setTotalTickets(long totalTickets) {
        this.totalTickets = totalTickets;
    }

    public long getPendingTickets() {
        return pendingTickets;
    }

    public void setPendingTickets(long pendingTickets) {
        this.pendingTickets = pendingTickets;
    }

    public long getInProgressTickets() {
        return inProgressTickets;
    }

    public void setInProgressTickets(long inProgressTickets) {
        this.inProgressTickets = inProgressTickets;
    }

    public long getResolvedTickets() {
        return resolvedTickets;
    }

    public void setResolvedTickets(long resolvedTickets) {
        this.resolvedTickets = resolvedTickets;
    }

    public long getCriticalTickets() {
        return criticalTickets;
    }

    public void setCriticalTickets(long criticalTickets) {
        this.criticalTickets = criticalTickets;
    }

    public long getReopenedTickets() {
        return reopenedTickets;
    }

    public void setReopenedTickets(long reopenedTickets) {
        this.reopenedTickets = reopenedTickets;
    }

    public double getAverageResolutionTimeHours() {
        return averageResolutionTimeHours;
    }

    public void setAverageResolutionTimeHours(double averageResolutionTimeHours) {
        this.averageResolutionTimeHours = averageResolutionTimeHours;
    }

    public double getAverageSatisfactionRating() {
        return averageSatisfactionRating;
    }

    public void setAverageSatisfactionRating(double averageSatisfactionRating) {
        this.averageSatisfactionRating = averageSatisfactionRating;
    }

    public long getTotalRatingsCount() {
        return totalRatingsCount;
    }

    public void setTotalRatingsCount(long totalRatingsCount) {
        this.totalRatingsCount = totalRatingsCount;
    }

    public double getResolvedPercentage() {
        return resolvedPercentage;
    }

    public void setResolvedPercentage(double resolvedPercentage) {
        this.resolvedPercentage = resolvedPercentage;
    }

    public Map<String, Long> getTicketsByRole() {
        return ticketsByRole;
    }

    public void setTicketsByRole(Map<String, Long> ticketsByRole) {
        this.ticketsByRole = ticketsByRole;
    }

    public Map<String, Long> getTicketsByCategory() {
        return ticketsByCategory;
    }

    public void setTicketsByCategory(Map<String, Long> ticketsByCategory) {
        this.ticketsByCategory = ticketsByCategory;
    }

    public Map<String, Long> getTicketsByStatus() {
        return ticketsByStatus;
    }

    public void setTicketsByStatus(Map<String, Long> ticketsByStatus) {
        this.ticketsByStatus = ticketsByStatus;
    }

    public Map<String, Long> getTicketsByPriority() {
        return ticketsByPriority;
    }

    public void setTicketsByPriority(Map<String, Long> ticketsByPriority) {
        this.ticketsByPriority = ticketsByPriority;
    }
}

