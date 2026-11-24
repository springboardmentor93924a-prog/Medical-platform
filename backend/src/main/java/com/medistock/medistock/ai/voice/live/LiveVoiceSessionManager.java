package com.medistock.medistock.ai.voice.live;

import com.medistock.medistock.ai.voice.dto.VoiceSessionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LiveVoiceSessionManager {

    private static final Logger log = LoggerFactory.getLogger(LiveVoiceSessionManager.class);

    public record ActiveSession(
            String sessionId,
            Integer userId,
            String mode,
            LocalDateTime createdAt,
            LocalDateTime lastActivityAt,
            int turnCount,
            String status,
            long sequence) {
        public ActiveSession withTurn() {
            return new ActiveSession(sessionId, userId, mode, createdAt, LocalDateTime.now(), turnCount + 1, status,
                    sequence);
        }

        public ActiveSession withStatus(String newStatus) {
            return new ActiveSession(sessionId, userId, mode, createdAt, LocalDateTime.now(), turnCount, newStatus,
                    sequence);
        }

        public VoiceSessionDto toDto() {
            return new VoiceSessionDto(sessionId, userId, status, mode, createdAt);
        }
    }

    private static final int MAX_CONCURRENT_SESSIONS_PER_USER = 3;
    private final java.util.concurrent.atomic.AtomicLong sequenceGenerator = new java.util.concurrent.atomic.AtomicLong(
            0);
    private final Map<String, ActiveSession> activeSessions = new ConcurrentHashMap<>();

    /**
     * Initializes a new live voice conversation session with concurrent user limit
     * enforcement.
     */
    public VoiceSessionDto createSession(Integer userId, String mode) {
        // Enforce rate limit: max 3 concurrent sessions per user, auto-evict oldest
        long userActiveCount = activeSessions.values().stream()
                .filter(s -> s.userId().equals(userId) && "ACTIVE".equals(s.status()))
                .count();

        if (userActiveCount >= MAX_CONCURRENT_SESSIONS_PER_USER) {
            activeSessions.values().stream()
                    .filter(s -> s.userId().equals(userId))
                    .min(java.util.Comparator.comparingLong(ActiveSession::sequence))
                    .ifPresent(oldest -> {
                        log.info("[LiveVoice] Evicting oldest session {} for user ID {} to enforce quota",
                                oldest.sessionId(), userId);
                        activeSessions.remove(oldest.sessionId());
                    });
        }

        String sessionId = "vlive_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String sessionMode = (mode != null && !mode.isBlank()) ? mode : "LIVE_VOICE";

        long seq = sequenceGenerator.incrementAndGet();
        ActiveSession session = new ActiveSession(
                sessionId,
                userId,
                sessionMode,
                LocalDateTime.now(),
                LocalDateTime.now(),
                0,
                "ACTIVE",
                seq);
        activeSessions.put(sessionId, session);
        log.info("[LiveVoice] Created live voice session {} for user ID {}", sessionId, userId);
        return session.toDto();
    }

    /**
     * Retrieves an active session, verifying user ownership.
     */
    public VoiceSessionDto getSession(String sessionId, Integer userId) {
        ActiveSession session = activeSessions.get(sessionId);
        if (session == null) {
            throw new NoSuchElementException("Live voice session not found: " + sessionId);
        }
        if (!session.userId().equals(userId)) {
            throw new SecurityException("Access denied: You do not own live voice session " + sessionId);
        }
        return session.toDto();
    }

    /**
     * Increments the turn count and refreshes the activity timestamp.
     */
    public void recordTurn(String sessionId, Integer userId) {
        ActiveSession session = activeSessions.get(sessionId);
        if (session != null && session.userId().equals(userId)) {
            activeSessions.put(sessionId, session.withTurn());
        }
    }

    /**
     * Closes and removes a live voice session.
     */
    public void closeSession(String sessionId, Integer userId) {
        ActiveSession session = activeSessions.get(sessionId);
        if (session != null) {
            if (!session.userId().equals(userId)) {
                throw new SecurityException("Access denied: Cannot close session owned by another user.");
            }
            activeSessions.remove(sessionId);
            log.info("[LiveVoice] Closed live voice session {} for user ID {}", sessionId, userId);
        }
    }

    /**
     * Periodic cleanup of inactive sessions (> 30 minutes idle).
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void cleanupStaleSessions() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);
        activeSessions.entrySet().removeIf(entry -> {
            boolean isStale = entry.getValue().lastActivityAt().isBefore(threshold);
            if (isStale) {
                log.info("[LiveVoice] Evicting stale live voice session {}", entry.getKey());
            }
            return isStale;
        });
    }

    public int getActiveSessionCount() {
        return activeSessions.size();
    }
}
