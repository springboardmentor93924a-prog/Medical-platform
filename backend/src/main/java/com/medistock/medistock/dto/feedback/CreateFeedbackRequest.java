package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateFeedbackRequest {

    @NotBlank(message = "Feedback title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Detailed description is required")
    private String description;

    @NotBlank(message = "Feedback category is required")
    private String category;

    private String priority = "MEDIUM";

    private String relatedModule;

    public CreateFeedbackRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getRelatedModule() {
        return relatedModule;
    }

    public void setRelatedModule(String relatedModule) {
        this.relatedModule = relatedModule;
    }
}

