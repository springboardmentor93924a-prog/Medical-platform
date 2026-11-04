
package com.medistock.controller;

import com.medistock.dto.StockCheckRequest;
import com.medistock.dto.StockCheckReviewRequest;
import com.medistock.entity.StockCheckReport;
import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import com.medistock.service.StockCheckReportService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/stock-check-reports")
public class StockCheckReportController {

    private final StockCheckReportService reportService;
    private final UserRepository userRepository;

    public StockCheckReportController(
            StockCheckReportService reportService,
            UserRepository userRepository) {

        this.reportService = reportService;
        this.userRepository = userRepository;
        System.out.println("StockCheckReportController LOADED!");
    }

    // Staff submits a report.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STAFF')")
    public StockCheckReport submitReport(
            @RequestBody StockCheckRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return reportService.submitReport(
                request,
                user.getUserId()
        );
    }

    // Staff views their own reports.
    @GetMapping("/my")
    @PreAuthorize("hasRole('STAFF')")
    public List<StockCheckReport> getMyReports(
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return reportService.getMyReports(user.getUserId());
    }

    // Admin and Pharmacist view all reports.
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public List<StockCheckReport> getAllReports() {
        return reportService.getAllReports();
    }

    // Admin and Pharmacist approve a report.
    @PutMapping("/{reportId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public StockCheckReport approveReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) StockCheckReviewRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return reportService.approveReport(
                reportId,
                user.getUserId(),
                request
        );
    }

    // Admin and Pharmacist reject a report.
    @PutMapping("/{reportId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public StockCheckReport rejectReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) StockCheckReviewRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        return reportService.rejectReport(
                reportId,
                user.getUserId(),
                request
        );
    }


    @GetMapping("/test")
public String test() {
    return "Stock Check Report API is working!";
}

    private User getAuthenticatedUser(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"
                ));
    }
}
