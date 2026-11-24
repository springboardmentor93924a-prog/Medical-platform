package com.medistock.medistock.dto;

public class VerifyWastageRequest {

    private String verificationRemarks;
    private Boolean proceedToAdminApproval = true;

    public VerifyWastageRequest() {}

    public String getVerificationRemarks() { return verificationRemarks; }
    public void setVerificationRemarks(String verificationRemarks) { this.verificationRemarks = verificationRemarks; }

    public Boolean getProceedToAdminApproval() { return proceedToAdminApproval; }
    public void setProceedToAdminApproval(Boolean proceedToAdminApproval) { this.proceedToAdminApproval = proceedToAdminApproval; }
}

