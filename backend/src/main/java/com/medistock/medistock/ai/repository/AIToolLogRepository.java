package com.medistock.medistock.ai.repository;

import com.medistock.medistock.ai.entity.AIToolLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIToolLogRepository extends JpaRepository<AIToolLog, Integer> {
    List<AIToolLog> findByUserIdOrderByExecutedAtDesc(Integer userId);
    List<AIToolLog> findTop20ByOrderByExecutedAtDesc();
}
