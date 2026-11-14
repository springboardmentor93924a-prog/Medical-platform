package com.medistock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "backup_records")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class BackupRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false, length = 150)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Column(nullable = false, length = 30)
    private String status = "COMPLETED";

    @Column(name = "record_counts", columnDefinition = "TEXT")
    private String recordCounts;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public BackupRecord() {
    }

    public BackupRecord(String fileName, String filePath, Long fileSizeBytes, String status, String recordCounts, String checksumSha256, User createdBy) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSizeBytes = fileSizeBytes;
        this.status = status;
        this.recordCounts = recordCounts;
        this.checksumSha256 = checksumSha256;
        this.createdBy = createdBy;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "COMPLETED";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    @JsonProperty("fileSize")
    public Long getFileSize() {
        return fileSizeBytes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRecordCounts() {
        return recordCounts;
    }

    public void setRecordCounts(String recordCounts) {
        this.recordCounts = recordCounts;
    }

    @JsonIgnore
    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public String getChecksumSha256() {
        return checksumSha256;
    }

    public void setChecksumSha256(String checksumSha256) {
        this.checksumSha256 = checksumSha256;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonProperty("createdByName")
    public String getCreatedByName() {
        return createdBy != null ? createdBy.getFullName() : null;
    }

    @JsonProperty("createdByEmail")
    public String getCreatedByEmail() {
        return createdBy != null ? createdBy.getEmail() : null;
    }

    @JsonProperty("totalRecords")
    public Integer getTotalRecords() {
        if (recordCounts == null || recordCounts.isBlank()) {
            return null;
        }
        try {
            // Parse counts like {"categories":5,"suppliers":7,"medicines":18,"total":30}
            if (recordCounts.contains("\"total\":")) {
                int start = recordCounts.indexOf("\"total\":") + 8;
                int end = recordCounts.indexOf(",", start);
                if (end == -1) end = recordCounts.indexOf("}", start);
                return Integer.parseInt(recordCounts.substring(start, end).trim());
            }
        } catch (Exception ignored) {}
        return null;
    }

    @JsonProperty("recordBreakdown")
    public String getRecordBreakdown() {
        if (recordCounts == null || recordCounts.isBlank()) {
            return null;
        }
        return recordCounts.replace("{", "").replace("}", "").replace("\"", "");
    }
}
