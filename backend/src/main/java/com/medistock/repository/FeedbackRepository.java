package com.medistock.repository;

import com.medistock.entity.Feedback;
import com.medistock.enums.FeedbackCategory;
import com.medistock.enums.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    @Query("SELECT f FROM Feedback f WHERE f.user.id = :userId ORDER BY f.createdAt DESC")
    Page<Feedback> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT f FROM Feedback f WHERE " +
           "(:status IS NULL OR f.status = :status) AND " +
           "(:category IS NULL OR f.category = :category)")
    Page<Feedback> filterFeedback(@Param("status") FeedbackStatus status,
                                  @Param("category") FeedbackCategory category,
                                  Pageable pageable);

    long countByStatus(FeedbackStatus status);
}
