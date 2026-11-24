package com.medistock.medistock.repository;

import com.medistock.medistock.entity.FeedbackInternalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackInternalNoteRepository extends JpaRepository<FeedbackInternalNote, Integer> {

    List<FeedbackInternalNote> findByTicketIdOrderByCreatedAtDesc(Integer ticketId);
}

