package com.medistock.medistock.ai.repository;

import com.medistock.medistock.ai.entity.AIRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, Integer> {

    List<AIRecommendation> findByMedicineIdOrderByGeneratedAtDesc(Integer medicineId);

    List<AIRecommendation> findByStatusOrderByGeneratedAtDesc(String status);

    List<AIRecommendation> findByRecommendationTypeOrderByGeneratedAtDesc(String recommendationType);

    Optional<AIRecommendation> findTopByMedicineIdOrderByGeneratedAtDesc(Integer medicineId);
}
