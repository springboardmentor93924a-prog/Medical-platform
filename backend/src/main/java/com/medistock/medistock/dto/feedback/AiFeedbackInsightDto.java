package com.medistock.medistock.dto.feedback;

import java.util.List;

public class AiFeedbackInsightDto {

    private String recommendedCategory;
    private String recommendedPriority;
    private String priorityReason;
    private Double sentimentScore;
    private String sentimentLabel;
    private String summary;
    private List<String> duplicateCandidates;
    private String suggestedAdminReply;
    private Double confidence;

    public AiFeedbackInsightDto() {
    }

    public String getRecommendedCategory() {
        return recommendedCategory;
    }

    public void setRecommendedCategory(String recommendedCategory) {
        this.recommendedCategory = recommendedCategory;
    }

    public String getRecommendedPriority() {
        return recommendedPriority;
    }

    public void setRecommendedPriority(String recommendedPriority) {
        this.recommendedPriority = recommendedPriority;
    }

    public String getPriorityReason() {
        return priorityReason;
    }

    public void setPriorityReason(String priorityReason) {
        this.priorityReason = priorityReason;
    }

    public Double getSentimentScore() {
        return sentimentScore;
    }

    public void setSentimentScore(Double sentimentScore) {
        this.sentimentScore = sentimentScore;
    }

    public String getSentimentLabel() {
        return sentimentLabel;
    }

    public void setSentimentLabel(String sentimentLabel) {
        this.sentimentLabel = sentimentLabel;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<String> getDuplicateCandidates() {
        return duplicateCandidates;
    }

    public void setDuplicateCandidates(List<String> duplicateCandidates) {
        this.duplicateCandidates = duplicateCandidates;
    }

    public String getSuggestedAdminReply() {
        return suggestedAdminReply;
    }

    public void setSuggestedAdminReply(String suggestedAdminReply) {
        this.suggestedAdminReply = suggestedAdminReply;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}

