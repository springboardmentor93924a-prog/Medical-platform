package com.medistock.medistock_backend.repository;

import com.medistock.medistock_backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findAllByOrderByCreatedAtDesc();
    List<Feedback> findByStatusOrderByCreatedAtDesc(String status);
    List<Feedback> findBySubmittedByEmailOrderByCreatedAtDesc(String email);
}