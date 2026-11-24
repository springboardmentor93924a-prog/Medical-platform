package com.medistock.medistock.dto.feedback;

import com.medistock.medistock.entity.*;
import java.util.List;

public class FeedbackTicketDetailDto {

    private FeedbackTicket ticket;
    private List<FeedbackMessage> messages;
    private List<FeedbackAttachment> attachments;
    private List<FeedbackStatusHistory> statusHistory;
    private FeedbackRating rating;
    private List<FeedbackInternalNote> internalNotes;
    private AiFeedbackInsightDto aiInsights;

    public FeedbackTicketDetailDto() {
    }

    public FeedbackTicket getTicket() {
        return ticket;
    }

    public void setTicket(FeedbackTicket ticket) {
        this.ticket = ticket;
    }

    public List<FeedbackMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<FeedbackMessage> messages) {
        this.messages = messages;
    }

    public List<FeedbackAttachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<FeedbackAttachment> attachments) {
        this.attachments = attachments;
    }

    public List<FeedbackStatusHistory> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<FeedbackStatusHistory> statusHistory) {
        this.statusHistory = statusHistory;
    }

    public FeedbackRating getRating() {
        return rating;
    }

    public void setRating(FeedbackRating rating) {
        this.rating = rating;
    }

    public List<FeedbackInternalNote> getInternalNotes() {
        return internalNotes;
    }

    public void setInternalNotes(List<FeedbackInternalNote> internalNotes) {
        this.internalNotes = internalNotes;
    }

    public AiFeedbackInsightDto getAiInsights() {
        return aiInsights;
    }

    public void setAiInsights(AiFeedbackInsightDto aiInsights) {
        this.aiInsights = aiInsights;
    }
}

