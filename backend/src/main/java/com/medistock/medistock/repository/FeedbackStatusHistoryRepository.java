package com.medistock.medistock.repository;

import com.medistock.medistock.entity.FeedbackStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackStatusHistoryRepository extends JpaRepository<FeedbackStatusHistory, Integer> {

    List<FeedbackStatusHistory> findByTicketIdOrderByChangedAtAsc(Integer ticketId);
}

