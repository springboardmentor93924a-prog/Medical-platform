package com.medistock.medistock.repository;

import com.medistock.medistock.entity.FeedbackRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeedbackRatingRepository extends JpaRepository<FeedbackRating, Integer> {

    Optional<FeedbackRating> findByTicketId(Integer ticketId);

    @Query("SELECT AVG(r.rating) FROM FeedbackRating r")
    Double getAverageRating();

    long countByIssueResolved(Boolean issueResolved);
}

