package com.medistock.medistock.dto.email;

public class EmailPreferenceDto {
    private String category;
    private String displayName;
    private String description;
    private boolean enabled;
    private boolean mandatory;

    public EmailPreferenceDto() {}

    public EmailPreferenceDto(String category, String displayName, String description, boolean enabled, boolean mandatory) {
        this.category = category;
        this.displayName = displayName;
        this.description = description;
        this.enabled = enabled;
        this.mandatory = mandatory;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isMandatory() {
        return mandatory;
    }

    public void setMandatory(boolean mandatory) {
        this.mandatory = mandatory;
    }
}

