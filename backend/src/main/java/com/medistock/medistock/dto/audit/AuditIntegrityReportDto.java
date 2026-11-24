package com.medistock.medistock.dto.audit;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AuditIntegrityReportDto {
    private boolean chainValid;
    private long totalRecordsVerified;
    private String genesisHash;
    private String latestHash;
    private LocalDateTime verifiedAt;
    private List<String> discrepancies = new ArrayList<>();
    private String status; // SECURE, TAMPER_DETECTED, EMPTY

    public AuditIntegrityReportDto() {
        this.verifiedAt = LocalDateTime.now();
    }

    public boolean isChainValid() { return chainValid; }
    public void setChainValid(boolean chainValid) { this.chainValid = chainValid; }

    public long getTotalRecordsVerified() { return totalRecordsVerified; }
    public void setTotalRecordsVerified(long totalRecordsVerified) { this.totalRecordsVerified = totalRecordsVerified; }

    public String getGenesisHash() { return genesisHash; }
    public void setGenesisHash(String genesisHash) { this.genesisHash = genesisHash; }

    public String getLatestHash() { return latestHash; }
    public void setLatestHash(String latestHash) { this.latestHash = latestHash; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public List<String> getDiscrepancies() { return discrepancies; }
    public void setDiscrepancies(List<String> discrepancies) { this.discrepancies = discrepancies; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
