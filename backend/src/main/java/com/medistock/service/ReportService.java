
package com.medistock.service;

import com.medistock.entity.Report;
import com.medistock.entity.User;
import com.medistock.repository.ReportRepository;
import com.medistock.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    // Constructor injection
    public ReportService(
            ReportRepository reportRepository,
            UserRepository userRepository) {

        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    // Save generated report
    @Transactional
    public Report saveReport(
            String reportType,
            String filePath,
            String userEmail) {

        Long userId = userRepository.findByEmail(userEmail)
                .map(User::getUserId)
                .orElse(null);

        Report report = new Report();

        report.setReportType(reportType);
        report.setGeneratedBy(userId);
        report.setFilePath(filePath);

        return reportRepository.save(report);
    }

    // Get report by ID
    @Transactional(readOnly = true)
    public Report getReportById(Long reportId) {

        return reportRepository.findById(reportId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Report not found with ID: " + reportId
                        )
                );
    }

    // Get all generated reports
    @Transactional(readOnly = true)
    public List<Report> getAllReports() {

        return reportRepository.findAll();
    }

    // Get reports by report type
    @Transactional(readOnly = true)
    public List<Report> getReportsByType(String reportType) {

        return reportRepository.findByReportType(reportType);
    }

    // Delete report by ID
    @Transactional
    public void deleteReport(Long reportId) {

        if (!reportRepository.existsById(reportId)) {
            throw new RuntimeException(
                    "Report not found with ID: " + reportId
            );
        }

        reportRepository.deleteById(reportId);
    }
}
