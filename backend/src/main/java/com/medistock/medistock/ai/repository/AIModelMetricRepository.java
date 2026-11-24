package com.medistock.medistock.ai.repository;

import com.medistock.medistock.ai.entity.AIModelMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIModelMetricRepository extends JpaRepository<AIModelMetric, Integer> {
    List<AIModelMetric> findByModelNameOrderByEvaluatedAtDesc(String modelName);
}
