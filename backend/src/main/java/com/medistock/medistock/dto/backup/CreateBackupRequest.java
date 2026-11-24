package com.medistock.medistock.dto.backup;

public class CreateBackupRequest {

    private String backupName;
    private String description;
    private String scope = "FULL_DATABASE"; // FULL_DATABASE, DATA_ONLY, SCHEMA_ONLY

    public CreateBackupRequest() {}

    public String getBackupName() {
        return backupName;
    }

    public void setBackupName(String backupName) {
        this.backupName = backupName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }
}

