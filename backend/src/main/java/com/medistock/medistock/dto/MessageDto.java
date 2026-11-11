package com.medistock.medistock.dto;

public class MessageDto {

    private Integer messageId;
    private Integer senderId;
    private String senderName;
    private Integer receiverId;
    private String receiverName;
    private String messageText;
    private String sentAt;
    private boolean isOutgoing;
    private boolean isRead;

    public MessageDto() {
    }

    public MessageDto(Integer messageId, Integer senderId, String senderName, Integer receiverId, String receiverName, String messageText, String sentAt, boolean isOutgoing, boolean isRead) {
        this.messageId = messageId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.messageText = messageText;
        this.sentAt = sentAt;
        this.isOutgoing = isOutgoing;
        this.isRead = isRead;
    }

    public Integer getMessageId() {
        return messageId;
    }

    public void setMessageId(Integer messageId) {
        this.messageId = messageId;
    }

    public Integer getSenderId() {
        return senderId;
    }

    public void setSenderId(Integer senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public Integer getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Integer receiverId) {
        this.receiverId = receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public String getSentAt() {
        return sentAt;
    }

    public void setSentAt(String sentAt) {
        this.sentAt = sentAt;
    }

    public boolean isOutgoing() {
        return isOutgoing;
    }

    public void setOutgoing(boolean outgoing) {
        isOutgoing = outgoing;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }
}
