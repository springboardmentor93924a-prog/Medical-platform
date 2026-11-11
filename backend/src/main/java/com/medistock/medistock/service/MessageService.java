package com.medistock.medistock.service;

import com.medistock.medistock.dto.ContactDto;
import com.medistock.medistock.dto.MessageDto;
import com.medistock.medistock.dto.SendMessageRequest;
import com.medistock.medistock.entity.Message;
import com.medistock.medistock.entity.User;
import com.medistock.medistock.repository.MessageRepository;
import com.medistock.medistock.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public MessageService(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ContactDto> getContacts(Integer currentUserId) {
        if (currentUserId == null) currentUserId = 1; // Default to Admin
        List<User> users = userRepository.findContactsForUser(currentUserId);
        List<ContactDto> contactDtos = new ArrayList<>();

        for (User u : users) {
            String roleName = (u.getRole() != null) ? u.getRole().getRoleName() : "STAFF";
            ContactDto dto = new ContactDto(u.getUserId(), u.getName(), u.getEmail(), u.getPhone(), roleName);

            // Fetch last message preview if exists
            List<Message> latest = messageRepository.findLatestMessageBetween(currentUserId, u.getUserId());
            if (!latest.isEmpty()) {
                Message last = latest.get(0);
                dto.setLastMessage(last.getMessageText());
                dto.setLastMessageTime(last.getSentAt().format(formatter));
            } else {
                dto.setLastMessage("Click to start conversation...");
                dto.setLastMessageTime("");
            }
            contactDtos.add(dto);
        }

        return contactDtos;
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getConversation(Integer currentUserId, Integer contactId) {
        if (currentUserId == null) currentUserId = 1;
        List<Message> messages = messageRepository.findConversation(currentUserId, contactId);
        List<MessageDto> dtos = new ArrayList<>();

        for (Message m : messages) {
            boolean isOutgoing = m.getSender().getUserId().equals(currentUserId);
            dtos.add(new MessageDto(
                    m.getMessageId(),
                    m.getSender().getUserId(),
                    m.getSender().getName(),
                    m.getReceiver().getUserId(),
                    m.getReceiver().getName(),
                    m.getMessageText(),
                    m.getSentAt().format(formatter),
                    isOutgoing,
                    m.getIsRead()
            ));
        }

        return dtos;
    }

    @Transactional
    public MessageDto sendMessage(SendMessageRequest req) {
        Integer senderId = (req.getSenderId() != null) ? req.getSenderId() : 1; // Default Admin
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found with ID: " + senderId));
        User receiver = userRepository.findById(req.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found with ID: " + req.getReceiverId()));

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setMessageText(req.getMessageText());
        message.setIsRead(false);

        Message saved = messageRepository.save(message);

        return new MessageDto(
                saved.getMessageId(),
                sender.getUserId(),
                sender.getName(),
                receiver.getUserId(),
                receiver.getName(),
                saved.getMessageText(),
                saved.getSentAt().format(formatter),
                true,
                false
        );
    }
}
