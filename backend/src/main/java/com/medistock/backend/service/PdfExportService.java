package com.medistock.backend.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.medistock.backend.dto.ReportDtos.ReportResponse;
import org.springframework.stereotype.Service;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfExportService {
    private final SettingsService settings;

    public PdfExportService(SettingsService settings) { this.settings = settings; }

    public byte[] export(ReportResponse r) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(new Paragraph(settings.organisationName() + " - " + r.title(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16)));
            doc.add(new Paragraph("Generated " + r.generatedAt().replace('T', ' ').substring(0, 16) + " UTC",
                FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, Color.GRAY)));
            doc.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(r.columns().size());
            table.setWidthPercentage(100);
            table.setHeaderRows(1);   // header repeats on every page

            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.NORMAL, Color.WHITE);
            for (String c : r.columns()) {
                PdfPCell cell = new PdfPCell(new Phrase(c, headFont));
                cell.setBackgroundColor(new Color(15, 118, 110));
                cell.setPadding(5);
                table.addCell(cell);
            }
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f);
            List<List<String>> rows = r.rows();
            for (int i = 0; i < rows.size(); i++) {
                for (String v : rows.get(i)) {
                    PdfPCell cell = new PdfPCell(new Phrase(v, bodyFont));
                    cell.setPadding(4);
                    if (i % 2 == 1) cell.setBackgroundColor(new Color(240, 249, 248));
                    table.addCell(cell);
                }
            }
            doc.add(table);
            if (rows.isEmpty()) doc.add(new Paragraph("Nothing to report.", bodyFont));
            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not create the PDF file", e);
        }
    }
}
