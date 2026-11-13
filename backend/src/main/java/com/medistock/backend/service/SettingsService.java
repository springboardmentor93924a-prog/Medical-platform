package com.medistock.backend.service;

import com.medistock.backend.dto.SettingsDtos.*;
import com.medistock.backend.entity.AppSetting;
import com.medistock.backend.repository.AppSettingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {
    private static final String ORG = "organisationName", REORDER = "defaultReorderLevel",
        APPROVAL = "requireOrderApproval", DIGEST = "dailyAlertEmail", EVENT_EMAIL = "emailNotifications", EVENT_SMS = "smsNotifications";

    private final AppSettingRepository repo;
    private final boolean digestDefault;

    public SettingsService(AppSettingRepository repo, @Value("${app.alerts.email.enabled:false}") boolean digestDefault) {
        this.repo = repo; this.digestDefault = digestDefault;
    }

    public String organisationName() { return get(ORG, "MediStock"); }

    public int defaultReorderLevel() {
        try { return Integer.parseInt(get(REORDER, "50")); } catch (NumberFormatException e) { return 50; }
    }

    public boolean requireOrderApproval() { return Boolean.parseBoolean(get(APPROVAL, "true")); }

    // Until the Admin saves this setting, the old application.properties value is used
    public boolean dailyAlertEmail() { return Boolean.parseBoolean(get(DIGEST, String.valueOf(digestDefault))); }

    public boolean eventEmails() { return Boolean.parseBoolean(get(EVENT_EMAIL, "true")); }

    public boolean eventSms() { return Boolean.parseBoolean(get(EVENT_SMS, "false")); }

    public SettingsResponse all() {
        return new SettingsResponse(organisationName(), defaultReorderLevel(), requireOrderApproval(), dailyAlertEmail(), eventEmails(), eventSms());
    }

    public PublicSettings publicSettings() {
        return new PublicSettings(organisationName(), defaultReorderLevel(), requireOrderApproval());
    }

    @Transactional
    public SettingsResponse update(SettingsRequest r, String username) {
        put(ORG, r.organisationName().trim(), username);
        put(REORDER, String.valueOf(r.defaultReorderLevel()), username);
        put(APPROVAL, String.valueOf(r.requireOrderApproval()), username);
        put(DIGEST, String.valueOf(r.dailyAlertEmail()), username);
        put(EVENT_EMAIL, String.valueOf(r.emailNotifications()), username);
        put(EVENT_SMS, String.valueOf(r.smsNotifications()), username);
        return all();
    }

    private String get(String key, String fallback) {
        return repo.findById(key).map(AppSetting::getValue).orElse(fallback);
    }

    private void put(String key, String value, String username) {
        AppSetting s = repo.findById(key).orElse(null);
        if (s == null) { repo.save(new AppSetting(key, value, username)); return; }
        s.setValue(value);
        s.setUpdatedBy(username);
    }
}
