package com.medistock.medistock.service;

import com.medistock.medistock.dto.email.EmailPreferenceDto;
import com.medistock.medistock.entity.EmailPreference;
import com.medistock.medistock.repository.EmailPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EmailPreferenceService {

    private final EmailPreferenceRepository preferenceRepository;

    // Defined Categories metadata
    private static final List<CategoryMeta> SYSTEM_CATEGORIES = List.of(
            new CategoryMeta("PURCHASE_ORDERS", "Purchase Order Updates", "Order approvals, status changes, delivery receipts and vendor confirmations.", false),
            new CategoryMeta("INVENTORY_ALERTS", "Inventory & Low Stock Alerts", "Immediate alerts when medicines reach safety minimum thresholds.", false),
            new CategoryMeta("EXPIRY_FEFO", "FEFO & Expiry Warnings", "Batch expiry notifications and First Expiry First Out allocation advisories.", false),
            new CategoryMeta("TASKS", "Task & Operational Assignments", "Assignments for stock verification, temperature checks, and receiving duties.", false),
            new CategoryMeta("FEEDBACK", "Feedback & Support Resolutions", "Replies and status progressions on reported operational and system issues.", false),
            new CategoryMeta("DAILY_DIGEST", "Daily Inventory Digest", "Executive daily email summary of inventory valuation, alerts, and pending POs.", false),
            new CategoryMeta("SECURITY_ALERTS", "Security & System Alerts", "Mandatory system integrity, unauthorized access, and disaster recovery alerts.", true)
    );

    public EmailPreferenceService(EmailPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional(readOnly = true)
    public List<EmailPreferenceDto> getPreferencesForUser(Integer userId) {
        List<EmailPreference> existing = preferenceRepository.findByUserId(userId);
        Map<String, Boolean> statusMap = new HashMap<>();
        for (EmailPreference p : existing) {
            statusMap.put(p.getNotificationCategory(), p.getEnabled());
        }

        List<EmailPreferenceDto> dtos = new ArrayList<>();
        for (CategoryMeta meta : SYSTEM_CATEGORIES) {
            boolean isEnabled = statusMap.getOrDefault(meta.category, true);
            // Mandatory categories are always true
            if (meta.mandatory) {
                isEnabled = true;
            }
            dtos.add(new EmailPreferenceDto(meta.category, meta.name, meta.description, isEnabled, meta.mandatory));
        }

        return dtos;
    }

    @Transactional
    public List<EmailPreferenceDto> updatePreferences(Integer userId, Map<String, Boolean> requestedUpdates) {
        if (requestedUpdates == null || requestedUpdates.isEmpty()) {
            return getPreferencesForUser(userId);
        }

        for (CategoryMeta meta : SYSTEM_CATEGORIES) {
            if (requestedUpdates.containsKey(meta.category)) {
                boolean desiredState = meta.mandatory || Boolean.TRUE.equals(requestedUpdates.get(meta.category));
                Optional<EmailPreference> existingOpt = preferenceRepository.findByUserIdAndNotificationCategory(userId, meta.category);

                EmailPreference pref;
                if (existingOpt.isPresent()) {
                    pref = existingOpt.get();
                    pref.setEnabled(desiredState);
                } else {
                    pref = new EmailPreference(userId, meta.category, desiredState);
                }
                preferenceRepository.save(pref);
            }
        }

        return getPreferencesForUser(userId);
    }

    /**
     * Determines whether an email should be sent for a given user and notification category.
     * Mandatory categories always return true.
     */
    @Transactional(readOnly = true)
    public boolean isEmailEnabled(Integer userId, String category) {
        if (userId == null) {
            return true; // External or system-level recipient without user ID
        }

        if (isMandatoryCategory(category)) {
            return true;
        }

        Optional<EmailPreference> pref = preferenceRepository.findByUserIdAndNotificationCategory(userId, category);
        return pref.map(EmailPreference::getEnabled).orElse(true);
    }

    public boolean isMandatoryCategory(String category) {
        if (category == null) return false;
        return "SECURITY_ALERTS".equalsIgnoreCase(category)
                || "SECURITY".equalsIgnoreCase(category)
                || "DISASTER_RECOVERY".equalsIgnoreCase(category);
    }

    private static class CategoryMeta {
        final String category;
        final String name;
        final String description;
        final boolean mandatory;

        CategoryMeta(String category, String name, String description, boolean mandatory) {
            this.category = category;
            this.name = name;
            this.description = description;
            this.mandatory = mandatory;
        }
    }
}

