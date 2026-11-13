package com.medistock.backend.controller;

import com.medistock.backend.dto.ReportDtos.ReportResponse;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.service.ExcelExportService;
import com.medistock.backend.service.PdfExportService;
import com.medistock.backend.service.ReportService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportDownloadController {
    private static final MediaType XLSX =
        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final ReportService reports;
    private final ExcelExportService excel;
    private final PdfExportService pdf;

    public ReportDownloadController(ReportService reports, ExcelExportService excel, PdfExportService pdf) {
        this.reports = reports; this.excel = excel; this.pdf = pdf;
    }

    /** type = inventory, stock, expiry or purchases. format = xlsx or pdf. */
    @GetMapping("/{type}/download")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<byte[]> download(@PathVariable String type, @RequestParam String format) {
        ReportResponse report = reports.build(type);
        byte[] data;
        MediaType mediaType;
        String ext = format.toLowerCase();
        switch (ext) {
            case "xlsx" -> { data = excel.export(report); mediaType = XLSX; }
            case "pdf" -> { data = pdf.export(report); mediaType = MediaType.APPLICATION_PDF; }
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Format must be xlsx or pdf");
        }
        String filename = "medistock-" + report.type() + "-" + LocalDate.now() + "." + ext;
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
            .contentType(mediaType)
            .body(data);
    }
}
