package com.medistock.service;

import com.medistock.dto.request.FeedbackRequest;
import com.medistock.dto.request.FeedbackStatusUpdateRequest;
import com.medistock.entity.Feedback;
import com.medistock.enums.FeedbackCategory;
import com.medistock.enums.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface FeedbackService {
    Feedback submitFeedback(FeedbackRequest request, String userEmail);
    Feedback updateFeedbackStatus(Long id, FeedbackStatusUpdateRequest request, String adminEmail);
    Page<Feedback> getAllFeedback(FeedbackStatus status, FeedbackCategory category, Pageable pageable);
    Page<Feedback> getMyFeedback(String userEmail, Pageable pageable);
    Feedback getFeedbackById(Long id);
    Map<String, Object> getFeedbackStats();
}
