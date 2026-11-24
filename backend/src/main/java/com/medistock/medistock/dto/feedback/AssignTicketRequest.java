package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class AssignTicketRequest {

    @NotNull(message = "Assigned user ID is required")
    private Integer assignedTo;

    private LocalDateTime deadlineAt;

    private String assignmentNote;

    public AssignTicketRequest() {
    }

    public Integer getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Integer assignedTo) {
        this.assignedTo = assignedTo;
    }

    public LocalDateTime getDeadlineAt() {
        return deadlineAt;
    }

    public void setDeadlineAt(LocalDateTime deadlineAt) {
        this.deadlineAt = deadlineAt;
    }

    public String getAssignmentNote() {
        return assignmentNote;
    }

    public void setAssignmentNote(String assignmentNote) {
        this.assignmentNote = assignmentNote;
    }
}

