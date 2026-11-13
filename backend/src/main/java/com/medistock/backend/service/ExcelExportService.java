package com.medistock.backend.service;

import com.medistock.backend.dto.ReportDtos.ReportResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Set;

@Service
public class ExcelExportService {
    // Only these columns become real numbers, so totals work in Excel. Everything else stays text.
    private static final Set<String> NUMERIC = Set.of("Qty", "Reorder level", "Days left", "Price (Rs)", "Total (Rs)", "Medicines", "Batches", "Units",
        "Stock value (Rs)", "Needs reorder", "Expired (with stock)", "Expiring in 90 days (with stock)",
        "Orders placed", "Orders received", "Total spent (Rs)", "On-time %", "Avg delivery days",
        "Change", "Quantity after", "Qty lost", "Value lost (Rs)");

    public byte[] export(ReportResponse r) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(WorkbookUtil.createSafeSheetName(r.title()));
            Font bold = wb.createFont();
            bold.setBold(true);
            CellStyle head = wb.createCellStyle();
            head.setFont(bold);
            head.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            head.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            int cols = r.columns().size();
            int[] width = new int[cols];
            Row header = sheet.createRow(0);
            for (int c = 0; c < cols; c++) {
                Cell cell = header.createCell(c);
                cell.setCellValue(r.columns().get(c));
                cell.setCellStyle(head);
                width[c] = r.columns().get(c).length();
            }
            for (int i = 0; i < r.rows().size(); i++) {
                Row row = sheet.createRow(i + 1);
                List<String> values = r.rows().get(i);
                for (int c = 0; c < cols; c++) {
                    String v = values.get(c);
                    Cell cell = row.createCell(c);
                    // Text is always stored as text (never as a formula), so a cell starting with "=" is harmless
                    if (NUMERIC.contains(r.columns().get(c)) && v.matches("-?\\d+(\\.\\d+)?")) cell.setCellValue(Double.parseDouble(v));
                    else cell.setCellValue(v);
                    width[c] = Math.max(width[c], v.length());
                }
            }
            for (int c = 0; c < cols; c++) sheet.setColumnWidth(c, Math.min(width[c] + 3, 60) * 256);
            sheet.createFreezePane(0, 1);
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not create the Excel file", e);
        }
    }
}
