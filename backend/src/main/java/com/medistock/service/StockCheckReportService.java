
package com.medistock.service;

import com.medistock.dto.StockCheckRequest;
import com.medistock.dto.StockCheckReviewRequest;
import com.medistock.dto.StockMovementRequest;
import com.medistock.entity.Inventory;
import com.medistock.entity.StockCheckReport;
import com.medistock.repository.InventoryRepository;
import com.medistock.repository.StockCheckReportRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockCheckReportService {

    private final InventoryRepository inventoryRepository;
    private final StockCheckReportRepository reportRepository;
    private final StockMovementService stockMovementService;

    public StockCheckReportService(
            InventoryRepository inventoryRepository,
            StockCheckReportRepository reportRepository,
            StockMovementService stockMovementService) {

        this.inventoryRepository = inventoryRepository;
        this.reportRepository = reportRepository;
        this.stockMovementService = stockMovementService;
    }

    // Staff submits a physical stock count.
    @Transactional
    public StockCheckReport submitReport(
            StockCheckRequest request,
            Long userId) {

        if (request == null
                || request.getInventoryId() == null
                || request.getPhysicalQuantity() == null
                || request.getPhysicalQuantity() < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valid inventory ID and physical quantity are required"
            );
        }

        Inventory inventory = inventoryRepository
                .findByIdForUpdate(request.getInventoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inventory batch not found"
                ));

        int systemQuantity = inventory.getQuantity();

        StockCheckReport report = new StockCheckReport();

        report.setInventoryId(inventory.getInventoryId());
        report.setSystemQuantity(systemQuantity);
        report.setPhysicalQuantity(request.getPhysicalQuantity());

        report.setDifference(
                request.getPhysicalQuantity() - systemQuantity
        );

        report.setRemarks(
                request.getRemarks() == null
                        ? null
                        : request.getRemarks().trim()
        );

        report.setReportedBy(userId);
        report.setStatus("PENDING");

        // Does NOT update inventory quantity.
        return reportRepository.save(report);
    }

    // Staff views their own reports.
    @Transactional(readOnly = true)
    public List<StockCheckReport> getMyReports(Long userId) {
        return reportRepository
                .findByReportedByOrderByReportedAtDesc(userId);
    }

    // Admin and Pharmacist view all reports.
    @Transactional(readOnly = true)
    public List<StockCheckReport> getAllReports() {
        return reportRepository.findAllByOrderByReportedAtDesc();
    }

    // Admin or Pharmacist approves a report.
    @Transactional
    public StockCheckReport approveReport(
            Long reportId,
            Long reviewerId,
            StockCheckReviewRequest request) {

        StockCheckReport report = getPendingReport(reportId);

        int difference = report.getDifference();

        // Apply the approved difference using the existing movement service.
        if (difference != 0) {

            StockMovementRequest movement = new StockMovementRequest();

            movement.setInventoryId(report.getInventoryId());
            movement.setChangeQuantity(Math.abs(difference));

            movement.setMovementType(
                    difference > 0 ? "IN" : "OUT"
            );

            String notes = "Approved stock check report #" + reportId;

            if (request != null
                    && request.getReviewRemarks() != null
                    && !request.getReviewRemarks().isBlank()) {

                notes += " - " + request.getReviewRemarks().trim();
            }

            movement.setNotes(notes);

            stockMovementService.recordMovement(
                    movement,
                    reviewerId
            );
        }

        report.setStatus("APPROVED");
        setReviewDetails(report, reviewerId, request);

        return reportRepository.save(report);
    }

    // Admin or Pharmacist rejects a report.
    @Transactional
    public StockCheckReport rejectReport(
            Long reportId,
            Long reviewerId,
            StockCheckReviewRequest request) {

        StockCheckReport report = getPendingReport(reportId);

        report.setStatus("REJECTED");
        setReviewDetails(report, reviewerId, request);

        return reportRepository.save(report);
    }

    private StockCheckReport getPendingReport(Long reportId) {

        StockCheckReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Stock check report not found"
                ));

        if (!"PENDING".equals(report.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This report has already been reviewed"
            );
        }

        return report;
    }

    private void setReviewDetails(
            StockCheckReport report,
            Long reviewerId,
            StockCheckReviewRequest request) {

        report.setReviewedBy(reviewerId);
        report.setReviewedAt(LocalDateTime.now());

        if (request != null) {
            report.setReviewRemarks(request.getReviewRemarks());
        }
    }
}
