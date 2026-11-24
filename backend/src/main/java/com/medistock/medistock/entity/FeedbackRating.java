package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback_ratings")
public class FeedbackRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    private Integer ratingId;

    @Column(name = "ticket_id", nullable = false, unique = true)
    private Integer ticketId;

    @Column(name = "rated_by", nullable = false)
    private Integer ratedBy;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "issue_resolved", nullable = false)
    private Boolean issueResolved = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rated_by", insertable = false, updatable = false)
    private User rater;

    public FeedbackRating() {
    }

    public Integer getRatingId() {
        return ratingId;
    }

    public void setRatingId(Integer ratingId) {
        this.ratingId = ratingId;
    }

    public Integer getTicketId() {
        return ticketId;
    }

    public void setTicketId(Integer ticketId) {
        this.ticketId = ticketId;
    }

    public Integer getRatedBy() {
        return ratedBy;
    }

    public void setRatedBy(Integer ratedBy) {
        this.ratedBy = ratedBy;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Boolean getIssueResolved() {
        return issueResolved;
    }

    public void setIssueResolved(Boolean issueResolved) {
        this.issueResolved = issueResolved;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getRater() {
        return rater;
    }

    public void setRater(User rater) {
        this.rater = rater;
    }
}

