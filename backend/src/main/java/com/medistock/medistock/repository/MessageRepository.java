package com.medistock.medistock.repository;

import com.medistock.medistock.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Integer> {

    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.userId = :user1Id AND m.receiver.userId = :user2Id) OR " +
           "(m.sender.userId = :user2Id AND m.receiver.userId = :user1Id) " +
           "ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("user1Id") Integer user1Id, @Param("user2Id") Integer user2Id);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.userId = :receiverId AND m.isRead = false")
    long countUnreadMessages(@Param("receiverId") Integer receiverId);

    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.userId = :user1Id AND m.receiver.userId = :user2Id) OR " +
           "(m.sender.userId = :user2Id AND m.receiver.userId = :user1Id) " +
           "ORDER BY m.sentAt DESC")
    List<Message> findLatestMessageBetween(@Param("user1Id") Integer user1Id, @Param("user2Id") Integer user2Id);
}
