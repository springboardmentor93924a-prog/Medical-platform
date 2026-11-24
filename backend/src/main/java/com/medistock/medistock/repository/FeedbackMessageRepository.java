package com.medistock.medistock.repository;

import com.medistock.medistock.entity.FeedbackMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackMessageRepository extends JpaRepository<FeedbackMessage, Integer> {

    List<FeedbackMessage> findByTicketIdOrderByCreatedAtAsc(Integer ticketId);

    long countByTicketId(Integer ticketId);
}

