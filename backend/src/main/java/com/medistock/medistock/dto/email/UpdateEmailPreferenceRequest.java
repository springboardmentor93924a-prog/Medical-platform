package com.medistock.medistock.dto.email;

import java.util.Map;

public class UpdateEmailPreferenceRequest {
    // Map of category -> enabled (e.g. {"PURCHASE_ORDERS": true, "TASKS": false})
    private Map<String, Boolean> preferences;

    public UpdateEmailPreferenceRequest() {}

    public UpdateEmailPreferenceRequest(Map<String, Boolean> preferences) {
        this.preferences = preferences;
    }

    public Map<String, Boolean> getPreferences() {
        return preferences;
    }

    public void setPreferences(Map<String, Boolean> preferences) {
        this.preferences = preferences;
    }
}

