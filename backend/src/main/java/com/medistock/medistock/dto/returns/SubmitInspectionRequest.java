package com.medistock.medistock.dto.returns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SubmitInspectionRequest {

    @NotBlank(message = "Inspection type is required")
    private String inspectionType; // PHYSICAL_INTEGRITY, TEMPERATURE_SEAL, EXPIRY_VERIFICATION, QUALITY_AUDIT

    @NotNull
    private Boolean packagingIntact = true;

    @NotNull
    private Boolean temperatureMaintained = true;

    @NotNull
    private Boolean batchVerified = true;

    @NotNull
    private Boolean passed = false;

    private String findings;

    public SubmitInspectionRequest() {}

    public String getInspectionType() {
        return inspectionType;
    }

    public void setInspectionType(String inspectionType) {
        this.inspectionType = inspectionType;
    }

    public Boolean getPackagingIntact() {
        return packagingIntact;
    }

    public void setPackagingIntact(Boolean packagingIntact) {
        this.packagingIntact = packagingIntact;
    }

    public Boolean getTemperatureMaintained() {
        return temperatureMaintained;
    }

    public void setTemperatureMaintained(Boolean temperatureMaintained) {
        this.temperatureMaintained = temperatureMaintained;
    }

    public Boolean getBatchVerified() {
        return batchVerified;
    }

    public void setBatchVerified(Boolean batchVerified) {
        this.batchVerified = batchVerified;
    }

    public Boolean getPassed() {
        return passed;
    }

    public void setPassed(Boolean passed) {
        this.passed = passed;
    }

    public String getFindings() {
        return findings;
    }

    public void setFindings(String findings) {
        this.findings = findings;
    }
}

