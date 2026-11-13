package com.medistock.backend.controller;

import com.medistock.backend.dto.ReportDtos.ReportResponse;
import com.medistock.backend.service.ReportService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService service;

    public ReportController(ReportService service) { this.service = service; }

    /** type = inventory, stock, expiry or purchases */
    @GetMapping("/{type}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ReportResponse report(@PathVariable String type) { return service.build(type); }
}
