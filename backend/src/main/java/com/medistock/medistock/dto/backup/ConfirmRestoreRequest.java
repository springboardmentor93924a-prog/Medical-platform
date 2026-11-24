package com.medistock.medistock.dto.backup;

import jakarta.validation.constraints.NotBlank;

public class ConfirmRestoreRequest {

    @NotBlank(message = "Admin password confirmation is required for database restoration")
    private String adminPassword;

    private boolean createPreRestoreBackup = true;
    private String recoveryReason;

    public ConfirmRestoreRequest() {}

    public String getAdminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    public boolean isCreatePreRestoreBackup() {
        return createPreRestoreBackup;
    }

    public void setCreatePreRestoreBackup(boolean createPreRestoreBackup) {
        this.createPreRestoreBackup = createPreRestoreBackup;
    }

    public String getRecoveryReason() {
        return recoveryReason;
    }

    public void setRecoveryReason(String recoveryReason) {
        this.recoveryReason = recoveryReason;
    }
}

