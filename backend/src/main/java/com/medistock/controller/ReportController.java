package com.medistock.controller;

import com.medistock.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'STAFF')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/inventory/pdf")
    public void exportInventoryPdf(HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_inventory_report.pdf\"");
        reportService.exportInventoryPdf(response.getOutputStream());
    }

    @GetMapping("/inventory/excel")
    public void exportInventoryExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_inventory_report.xlsx\"");
        reportService.exportInventoryExcel(response.getOutputStream());
    }

    @GetMapping("/inventory/csv")
    public void exportInventoryCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_inventory_report.csv\"");
        reportService.exportInventoryCsv(response.getWriter());
    }

    @GetMapping("/expiry/pdf")
    public void exportExpiryPdf(HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_expiry_audit.pdf\"");
        reportService.exportExpiryPdf(response.getOutputStream());
    }

    @GetMapping("/expiry/excel")
    public void exportExpiryExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_expiry_audit.xlsx\"");
        reportService.exportExpiryExcel(response.getOutputStream());
    }

    @GetMapping("/suppliers/excel")
    public void exportSuppliersExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_suppliers_report.xlsx\"");
        reportService.exportSuppliersExcel(response.getOutputStream());
    }

    @GetMapping("/purchase-orders/excel")
    public void exportPurchaseOrdersExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_purchase_orders.xlsx\"");
        reportService.exportPurchaseOrdersExcel(response.getOutputStream());
    }

    @GetMapping("/movements/csv")
    public void exportMovementsCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_stock_movements.csv\"");
        reportService.exportStockMovementsCsv(response.getWriter());
    }

    @GetMapping("/movements/pdf")
    public void exportMovementsPdf(HttpServletResponse response) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_stock_movements.pdf\"");
        reportService.exportStockMovementsPdf(response.getOutputStream());
    }

    @GetMapping("/movements/excel")
    public void exportMovementsExcel(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"medistock_stock_movements.xlsx\"");
        reportService.exportStockMovementsExcel(response.getOutputStream());
    }
}
