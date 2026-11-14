package com.medistock.dto.request;

import com.medistock.enums.FeedbackCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FeedbackRequest {

    @NotBlank(message = "Feedback subject is required")
    private String subject;

    @NotNull(message = "Feedback category is required")
    private FeedbackCategory category = FeedbackCategory.GENERAL;

    @NotBlank(message = "Feedback description is required")
    private String description;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating = 5;

    public FeedbackRequest() {
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public FeedbackCategory getCategory() {
        return category;
    }

    public void setCategory(FeedbackCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description != null ? description : message;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    private String message;

    public String getMessage() {
        return message != null ? message : description;
    }

    public void setMessage(String message) {
        this.message = message;
        if (this.description == null) {
            this.description = message;
        }
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }
}
