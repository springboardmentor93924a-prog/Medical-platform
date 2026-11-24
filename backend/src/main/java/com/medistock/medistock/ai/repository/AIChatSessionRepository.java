package com.medistock.medistock.ai.repository;

import com.medistock.medistock.ai.entity.AIChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIChatSessionRepository extends JpaRepository<AIChatSession, Integer> {
    List<AIChatSession> findByUserIdOrderByUpdatedAtDesc(Integer userId);
}
