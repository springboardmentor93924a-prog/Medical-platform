package com.medistock.medistock.ai.repository;

import com.medistock.medistock.ai.entity.AIChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIChatMessageRepository extends JpaRepository<AIChatMessage, Integer> {
    List<AIChatMessage> findBySessionIdOrderByCreatedAtAsc(Integer sessionId);
    List<AIChatMessage> findTop10BySessionIdOrderByCreatedAtDesc(Integer sessionId);
}
