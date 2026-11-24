package com.medistock.medistock.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class ReportRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @Column(name = "generated_by", nullable = false)
    private Integer generatedBy;

    @Column(name = "report_name", nullable = false, length = 150)
    private String reportName;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType;

    @Column(name = "date_from")
    private LocalDate dateFrom;

    @Column(name = "date_to")
    private LocalDate dateTo;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "generated_at", insertable = false, updatable = false)
    private LocalDateTime generatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "generated_by", insertable = false, updatable = false)
    private User generator;

    public ReportRecord() {
    }

    public Integer getReportId() {
        return reportId;
    }

    public void setReportId(Integer reportId) {
        this.reportId = reportId;
    }

    public Integer getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(Integer generatedBy) {
        this.generatedBy = generatedBy;
    }

    public String getReportName() {
        return reportName;
    }

    public void setReportName(String reportName) {
        this.reportName = reportName;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public LocalDate getDateFrom() {
        return dateFrom;
    }

    public void setDateFrom(LocalDate dateFrom) {
        this.dateFrom = dateFrom;
    }

    public LocalDate getDateTo() {
        return dateTo;
    }

    public void setDateTo(LocalDate dateTo) {
        this.dateTo = dateTo;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public User getGenerator() {
        return generator;
    }

    public void setGenerator(User generator) {
        this.generator = generator;
    }
}
