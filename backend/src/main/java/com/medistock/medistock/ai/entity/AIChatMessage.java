package com.medistock.medistock.ai.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_chat_messages")
public class AIChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "session_id", nullable = false)
    private Integer sessionId;

    @Column(name = "sender", nullable = false, length = 20)
    private String sender; // USER, ASSISTANT, TOOL

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Column(name = "provider_name", length = 50)
    private String providerName; // API_LLM, LOCAL_OLLAMA, SYSTEM

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private AIChatSession session;

    public AIChatMessage() {
    }

    public AIChatMessage(Integer sessionId, String sender, String messageText, String providerName) {
        this.sessionId = sessionId;
        this.sender = sender;
        this.messageText = messageText;
        this.providerName = providerName;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSessionId() {
        return sessionId;
    }

    public void setSessionId(Integer sessionId) {
        this.sessionId = sessionId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public AIChatSession getSession() {
        return session;
    }

    public void setSession(AIChatSession session) {
        this.session = session;
    }
}
