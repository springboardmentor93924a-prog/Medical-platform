package com.medistock.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.medistock.entity.Medicine;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.StockMovement;
import com.medistock.entity.Supplier;
import com.medistock.enums.MedicineStatus;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.StockMovementRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.service.ReportService;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.Writer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockMovementRepository stockMovementRepository;

    public ReportServiceImpl(MedicineRepository medicineRepository,
                             SupplierRepository supplierRepository,
                             PurchaseOrderRepository purchaseOrderRepository,
                             StockMovementRepository stockMovementRepository) {
        this.medicineRepository = medicineRepository;
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    private void styleHeaderCell(PdfPCell cell) {
        cell.setBackgroundColor(new Color(2, 132, 199)); // #0284c7 Sky 600
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
    }

    @Override
    public void exportInventoryPdf(OutputStream outputStream) {
        List<Medicine> medicines = medicineRepository.findAll();
        Document document = new Document(PageSize.A4.rotate());

        try {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(30, 41, 59));
            Paragraph title = new Paragraph("MediStock - Medicine Inventory Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            Paragraph subtitle = new Paragraph("Generated on: " + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + " | Total Items: " + medicines.size());
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 2.0f, 1.5f, 1.5f, 1.0f, 1.2f, 1.3f});

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            String[] headers = {"Medicine Name", "Category", "Batch No", "Supplier", "Stock", "Unit Price", "Expiry Date"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                styleHeaderCell(cell);
                table.addCell(cell);
            }

            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (Medicine m : medicines) {
                table.addCell(new Phrase(m.getName(), bodyFont));
                table.addCell(new Phrase(m.getCategory() != null ? m.getCategory().getName() : "-", bodyFont));
                table.addCell(new Phrase(m.getBatchNumber(), bodyFont));
                table.addCell(new Phrase(m.getSupplier() != null ? m.getSupplier().getCompanyName() : "-", bodyFont));
                table.addCell(new Phrase(String.valueOf(m.getQuantity()), bodyFont));
                table.addCell(new Phrase("$" + m.getUnitPrice().toPlainString(), bodyFont));
                table.addCell(new Phrase(m.getExpiryDate().toString(), bodyFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating inventory PDF report: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportInventoryExcel(OutputStream outputStream) {
        List<Medicine> medicines = medicineRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Inventory");

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Medicine Name", "Generic Name", "Category", "Batch Number", "Supplier", "Stock Qty", "Min Stock", "Unit Price", "Mfg Date", "Expiry Date", "Status"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Medicine m : medicines) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(m.getId());
                row.createCell(1).setCellValue(m.getName());
                row.createCell(2).setCellValue(m.getGenericName() != null ? m.getGenericName() : "");
                row.createCell(3).setCellValue(m.getCategory() != null ? m.getCategory().getName() : "");
                row.createCell(4).setCellValue(m.getBatchNumber());
                row.createCell(5).setCellValue(m.getSupplier() != null ? m.getSupplier().getCompanyName() : "");
                row.createCell(6).setCellValue(m.getQuantity());
                row.createCell(7).setCellValue(m.getMinimumStockLevel());
                row.createCell(8).setCellValue(m.getUnitPrice().doubleValue());
                row.createCell(9).setCellValue(m.getManufacturingDate().toString());
                row.createCell(10).setCellValue(m.getExpiryDate().toString());
                row.createCell(11).setCellValue(m.getStatus().name());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
        } catch (Exception e) {
            throw new RuntimeException("Error generating inventory Excel report: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportInventoryCsv(Writer writer) {
        List<Medicine> medicines = medicineRepository.findAll();
        try (PrintWriter pw = new PrintWriter(writer)) {
            pw.println("ID,Medicine Name,Category,Batch Number,Supplier,Quantity,Min Stock,Unit Price,Expiry Date,Status");
            for (Medicine m : medicines) {
                pw.printf("%d,\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%.2f,%s,%s%n",
                        m.getId(),
                        escapeCsv(m.getName()),
                        escapeCsv(m.getCategory() != null ? m.getCategory().getName() : ""),
                        escapeCsv(m.getBatchNumber()),
                        escapeCsv(m.getSupplier() != null ? m.getSupplier().getCompanyName() : ""),
                        m.getQuantity(),
                        m.getMinimumStockLevel(),
                        m.getUnitPrice(),
                        m.getExpiryDate(),
                        m.getStatus().name()
                );
            }
            pw.flush();
        }
    }

    @Override
    public void exportExpiryPdf(OutputStream outputStream) {
        LocalDate today = LocalDate.now();
        List<Medicine> expired = medicineRepository.findExpiredMedicines(today);
        List<Medicine> nearExpiry = medicineRepository.findNearExpiryMedicines(today, today.plusDays(60));

        Document document = new Document(PageSize.A4.rotate());
        try {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(225, 29, 72));
            Paragraph title = new Paragraph("MediStock - Medicine Expiry & Near-Expiry Audit Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            Paragraph expiredSection = new Paragraph("1. Expired Medicines (Total: " + expired.size() + ")", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12));
            expiredSection.setSpacingAfter(10);
            document.add(expiredSection);

            PdfPTable expTable = new PdfPTable(6);
            expTable.setWidthPercentage(100);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            String[] headers = {"Medicine Name", "Batch Number", "Category", "Quantity", "Expiry Date", "Action Required"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(225, 29, 72)); // Rose 600
                cell.setPadding(5);
                expTable.addCell(cell);
            }

            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (Medicine m : expired) {
                expTable.addCell(new Phrase(m.getName(), bodyFont));
                expTable.addCell(new Phrase(m.getBatchNumber(), bodyFont));
                expTable.addCell(new Phrase(m.getCategory() != null ? m.getCategory().getName() : "-", bodyFont));
                expTable.addCell(new Phrase(String.valueOf(m.getQuantity()), bodyFont));
                expTable.addCell(new Phrase(m.getExpiryDate().toString(), bodyFont));
                expTable.addCell(new Phrase("DISPOSE IMMEDIATELY", bodyFont));
            }
            document.add(expTable);

            Paragraph nearExpSection = new Paragraph("\n2. Near-Expiry Medicines (Within 60 Days: " + nearExpiry.size() + ")", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12));
            nearExpSection.setSpacingAfter(10);
            document.add(nearExpSection);

            PdfPTable nearTable = new PdfPTable(6);
            nearTable.setWidthPercentage(100);
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(217, 119, 6)); // Amber 600
                cell.setPadding(5);
                nearTable.addCell(cell);
            }
            for (Medicine m : nearExpiry) {
                nearTable.addCell(new Phrase(m.getName(), bodyFont));
                nearTable.addCell(new Phrase(m.getBatchNumber(), bodyFont));
                nearTable.addCell(new Phrase(m.getCategory() != null ? m.getCategory().getName() : "-", bodyFont));
                nearTable.addCell(new Phrase(String.valueOf(m.getQuantity()), bodyFont));
                nearTable.addCell(new Phrase(m.getExpiryDate().toString(), bodyFont));
                nearTable.addCell(new Phrase("Prioritize Dispensing", bodyFont));
            }
            document.add(nearTable);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating expiry PDF report: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportExpiryExcel(OutputStream outputStream) {
        LocalDate today = LocalDate.now();
        List<Medicine> expired = medicineRepository.findExpiredMedicines(today);
        List<Medicine> nearExpiry = medicineRepository.findNearExpiryMedicines(today, today.plusDays(60));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Expiry Tracking");

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Medicine Name", "Batch Number", "Category", "Quantity", "Expiry Date", "Expiry Status"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Medicine m : expired) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(m.getName());
                row.createCell(1).setCellValue(m.getBatchNumber());
                row.createCell(2).setCellValue(m.getCategory() != null ? m.getCategory().getName() : "");
                row.createCell(3).setCellValue(m.getQuantity());
                row.createCell(4).setCellValue(m.getExpiryDate().toString());
                row.createCell(5).setCellValue("EXPIRED");
            }
            for (Medicine m : nearExpiry) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(m.getName());
                row.createCell(1).setCellValue(m.getBatchNumber());
                row.createCell(2).setCellValue(m.getCategory() != null ? m.getCategory().getName() : "");
                row.createCell(3).setCellValue(m.getQuantity());
                row.createCell(4).setCellValue(m.getExpiryDate().toString());
                row.createCell(5).setCellValue("NEAR_EXPIRY");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(outputStream);
        } catch (Exception e) {
            throw new RuntimeException("Error generating expiry Excel report: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportSuppliersExcel(OutputStream outputStream) {
        List<Supplier> suppliers = supplierRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Suppliers");
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Company Name", "Contact Person", "Email", "Phone", "Address", "Business Reg No", "Status"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Supplier s : suppliers) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(s.getId());
                row.createCell(1).setCellValue(s.getCompanyName());
                row.createCell(2).setCellValue(s.getContactPerson());
                row.createCell(3).setCellValue(s.getEmail());
                row.createCell(4).setCellValue(s.getPhone());
                row.createCell(5).setCellValue(s.getAddress());
                row.createCell(6).setCellValue(s.getBusinessRegistrationNumber() != null ? s.getBusinessRegistrationNumber() : "");
                row.createCell(7).setCellValue(s.getStatus().name());
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(outputStream);
        } catch (Exception e) {
            throw new RuntimeException("Error generating suppliers Excel report: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportPurchaseOrdersExcel(OutputStream outputStream) {
        List<PurchaseOrder> orders = purchaseOrderRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Purchase Orders");
            Row headerRow = sheet.createRow(0);
            String[] headers = {"PO Number", "Supplier", "Order Date", "Expected Delivery", "Status", "Payment Status", "Total Amount"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (PurchaseOrder po : orders) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(po.getPoNumber());
                row.createCell(1).setCellValue(po.getSupplier() != null ? po.getSupplier().getCompanyName() : "");
                row.createCell(2).setCellValue(po.getOrderDate().toString());
                row.createCell(3).setCellValue(po.getExpectedDeliveryDate() != null ? po.getExpectedDeliveryDate().toString() : "");
                row.createCell(4).setCellValue(po.getOrderStatus().name());
                row.createCell(5).setCellValue(po.getPaymentStatus().name());
                row.createCell(6).setCellValue(po.getTotalAmount().doubleValue());
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(outputStream);
        } catch (Exception e) {
            throw new RuntimeException("Error generating purchase orders Excel report: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportStockMovementsCsv(Writer writer) {
        List<StockMovement> movements = stockMovementRepository.findAll();
        try (PrintWriter pw = new PrintWriter(writer)) {
            pw.println("Movement ID,Medicine Name,Movement Type,Quantity,Reference,Performed By,Date Time,Reason");
            for (StockMovement sm : movements) {
                pw.printf("%d,\"%s\",\"%s\",%d,\"%s\",\"%s\",\"%s\",\"%s\"%n",
                        sm.getId(),
                        escapeCsv(sm.getMedicine() != null ? sm.getMedicine().getName() : ""),
                        sm.getMovementType().name(),
                        sm.getQuantity(),
                        escapeCsv(sm.getReferenceNumber() != null ? sm.getReferenceNumber() : ""),
                        escapeCsv(sm.getPerformedBy() != null ? sm.getPerformedBy().getFullName() : ""),
                        sm.getCreatedAt().toString(),
                        escapeCsv(sm.getReason() != null ? sm.getReason() : "")
                );
            }
            pw.flush();
        }
    }

    @Override
    public void exportStockMovementsPdf(OutputStream outputStream) {
        List<StockMovement> movements = stockMovementRepository.findAll();
        Document document = new Document(PageSize.A4.rotate());

        try {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(30, 41, 59));
            Paragraph title = new Paragraph("MediStock - Stock Movements Ledger", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            Paragraph subtitle = new Paragraph("Generated on: " + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + " | Total Records: " + movements.size());
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.0f, 2.5f, 1.5f, 1.5f, 1.0f, 1.5f, 1.5f});

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            String[] headers = {"Date & Time", "Medicine Name", "Batch / SKU", "Type", "Quantity", "Reference", "Logged By"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                styleHeaderCell(cell);
                table.addCell(cell);
            }

            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (StockMovement sm : movements) {
                table.addCell(new Phrase(sm.getCreatedAt() != null ? sm.getCreatedAt().toString() : "-", bodyFont));
                table.addCell(new Phrase(sm.getMedicine() != null ? sm.getMedicine().getName() : "-", bodyFont));
                table.addCell(new Phrase(sm.getMedicine() != null ? sm.getMedicine().getBatchNumber() : "-", bodyFont));
                table.addCell(new Phrase(sm.getMovementType() != null ? sm.getMovementType().name() : "-", bodyFont));
                table.addCell(new Phrase(sm.getQuantity() != null ? sm.getQuantity().toString() : "0", bodyFont));
                table.addCell(new Phrase(sm.getReferenceNumber() != null ? sm.getReferenceNumber() : "-", bodyFont));
                table.addCell(new Phrase(sm.getPerformedBy() != null ? sm.getPerformedBy().getFullName() : "System", bodyFont));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating stock movements PDF report: " + e.getMessage(), e);
        }
    }

    @Override
    public void exportStockMovementsExcel(OutputStream outputStream) {
        List<StockMovement> movements = stockMovementRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Stock Movements");

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"ID", "Date & Time", "Medicine Name", "Batch / SKU", "Movement Type", "Quantity", "Reference", "Performed By", "Reason"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (StockMovement sm : movements) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(sm.getId());
                row.createCell(1).setCellValue(sm.getCreatedAt() != null ? sm.getCreatedAt().toString() : "");
                row.createCell(2).setCellValue(sm.getMedicine() != null ? sm.getMedicine().getName() : "");
                row.createCell(3).setCellValue(sm.getMedicine() != null ? sm.getMedicine().getBatchNumber() : "");
                row.createCell(4).setCellValue(sm.getMovementType() != null ? sm.getMovementType().name() : "");
                row.createCell(5).setCellValue(sm.getQuantity() != null ? sm.getQuantity() : 0);
                row.createCell(6).setCellValue(sm.getReferenceNumber() != null ? sm.getReferenceNumber() : "");
                row.createCell(7).setCellValue(sm.getPerformedBy() != null ? sm.getPerformedBy().getFullName() : "System");
                row.createCell(8).setCellValue(sm.getReason() != null ? sm.getReason() : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(outputStream);
        } catch (Exception e) {
            throw new RuntimeException("Error generating stock movements Excel report: " + e.getMessage(), e);
        }
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return val.replace("\"", "\"\"");
    }
}
