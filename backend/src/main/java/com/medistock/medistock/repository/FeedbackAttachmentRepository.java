package com.medistock.medistock.repository;

import com.medistock.medistock.entity.FeedbackAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackAttachmentRepository extends JpaRepository<FeedbackAttachment, Integer> {

    List<FeedbackAttachment> findByTicketIdOrderByCreatedAtAsc(Integer ticketId);

    List<FeedbackAttachment> findByMessageId(Integer messageId);
}

