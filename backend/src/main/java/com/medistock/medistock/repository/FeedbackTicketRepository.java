package com.medistock.medistock.repository;

import com.medistock.medistock.entity.FeedbackTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackTicketRepository extends JpaRepository<FeedbackTicket, Integer>, JpaSpecificationExecutor<FeedbackTicket> {

    Optional<FeedbackTicket> findByTicketNumber(String ticketNumber);

    List<FeedbackTicket> findBySubmittedByOrderByCreatedAtDesc(Integer submittedBy);

    List<FeedbackTicket> findBySubmittedByOrAssignedToOrderByCreatedAtDesc(Integer submittedBy, Integer assignedTo);

    List<FeedbackTicket> findAllByOrderByCreatedAtDesc();

    Page<FeedbackTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(String status);

    long countByPriority(String priority);

    long countBySourceRole(String sourceRole);

    @Query("SELECT t.category, COUNT(t) FROM FeedbackTicket t GROUP BY t.category ORDER BY COUNT(t) DESC")
    List<Object[]> countByCategory();

    @Query("SELECT t.sourceRole, COUNT(t) FROM FeedbackTicket t GROUP BY t.sourceRole ORDER BY COUNT(t) DESC")
    List<Object[]> countByRole();

    @Query("SELECT t.status, COUNT(t) FROM FeedbackTicket t GROUP BY t.status ORDER BY COUNT(t) DESC")
    List<Object[]> countByStatusGroup();

    @Query("SELECT t.priority, COUNT(t) FROM FeedbackTicket t GROUP BY t.priority ORDER BY COUNT(t) DESC")
    List<Object[]> countByPriorityGroup();

    @Query(value = "SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)), 0) FROM feedback_tickets WHERE status = 'RESOLVED' AND resolved_at IS NOT NULL", nativeQuery = true)
    Double getAverageResolutionTimeHours();

    @Query("SELECT t FROM FeedbackTicket t WHERE t.status NOT IN ('CLOSED', 'REJECTED') ORDER BY t.createdAt DESC")
    List<FeedbackTicket> findActiveTickets();

    @Query("SELECT MAX(t.ticketId) FROM FeedbackTicket t")
    Integer findMaxTicketId();
}

