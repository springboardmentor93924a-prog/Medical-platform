package com.medistock.backend.dto;

import jakarta.validation.constraints.*;

public final class SettingsDtos {
    private SettingsDtos() {}

    public record SettingsResponse(String organisationName, int defaultReorderLevel,
                                   boolean requireOrderApproval, boolean dailyAlertEmail,
                                   boolean emailNotifications, boolean smsNotifications) {}

    public record SettingsRequest(
        @NotBlank(message = "Organisation name is required")
        @Size(min = 2, max = 60, message = "Name must be 2-60 characters")
        String organisationName,
        @NotNull(message = "Default reorder level is required")
        @Min(value = 0, message = "Cannot be negative") @Max(value = 100000, message = "Too large")
        Integer defaultReorderLevel,
        @NotNull(message = "Required") Boolean requireOrderApproval,
        @NotNull(message = "Required") Boolean dailyAlertEmail,
        @NotNull(message = "Required") Boolean emailNotifications,
        @NotNull(message = "Required") Boolean smsNotifications) {}

    /** The few settings every signed-in user needs: the sidebar name, form defaults and the approval note. */
    public record PublicSettings(String organisationName, int defaultReorderLevel, boolean requireOrderApproval) {}
}
