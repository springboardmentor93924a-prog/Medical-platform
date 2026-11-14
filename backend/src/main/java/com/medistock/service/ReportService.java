package com.medistock.service;

import java.io.OutputStream;
import java.io.Writer;

public interface ReportService {
    void exportInventoryPdf(OutputStream outputStream);
    void exportInventoryExcel(OutputStream outputStream);
    void exportInventoryCsv(Writer writer);

    void exportExpiryPdf(OutputStream outputStream);
    void exportExpiryExcel(OutputStream outputStream);

    void exportSuppliersExcel(OutputStream outputStream);
    void exportPurchaseOrdersExcel(OutputStream outputStream);
    void exportStockMovementsCsv(Writer writer);
    void exportStockMovementsPdf(OutputStream outputStream);
    void exportStockMovementsExcel(OutputStream outputStream);
}
