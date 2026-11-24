package com.medistock.medistock.dto;

import java.math.BigDecimal;

public class ApprovalWastageRequest {

    private String action; // APPROVE, REJECT
    private String approvalRemarks;
    private String rejectionReason;
    private BigDecimal supplierRecovery; // optional recovery refund amount

    public ApprovalWastageRequest() {}

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getApprovalRemarks() { return approvalRemarks; }
    public void setApprovalRemarks(String approvalRemarks) { this.approvalRemarks = approvalRemarks; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public BigDecimal getSupplierRecovery() { return supplierRecovery; }
    public void setSupplierRecovery(BigDecimal supplierRecovery) { this.supplierRecovery = supplierRecovery; }
}

