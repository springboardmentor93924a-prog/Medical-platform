package com.medistock.medistock.dto.email;

public class SendTestEmailRequest {
    private String recipientEmail;
    private String subject;
    private String testCategory; // e.g. "PURCHASE_ORDER", "INVENTORY_ALERT", "SYSTEM"

    public SendTestEmailRequest() {}

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getTestCategory() {
        return testCategory;
    }

    public void setTestCategory(String testCategory) {
        this.testCategory = testCategory;
    }
}

