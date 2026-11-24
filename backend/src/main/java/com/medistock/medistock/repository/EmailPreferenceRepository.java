package com.medistock.medistock.repository;

import com.medistock.medistock.entity.EmailPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailPreferenceRepository extends JpaRepository<EmailPreference, Integer> {

    List<EmailPreference> findByUserId(Integer userId);

    Optional<EmailPreference> findByUserIdAndNotificationCategory(Integer userId, String notificationCategory);

    boolean existsByUserIdAndNotificationCategoryAndEnabledTrue(Integer userId, String notificationCategory);
}

