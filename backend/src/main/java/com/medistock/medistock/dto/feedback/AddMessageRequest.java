package com.medistock.medistock.dto.feedback;

import jakarta.validation.constraints.NotBlank;

public class AddMessageRequest {

    @NotBlank(message = "Message text cannot be empty")
    private String message;

    private String messageType = "USER_MESSAGE";

    public AddMessageRequest() {
    }

    public AddMessageRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }
}

