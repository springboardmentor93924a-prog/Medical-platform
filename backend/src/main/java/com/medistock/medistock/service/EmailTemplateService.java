package com.medistock.medistock.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class EmailTemplateService {

    @Value("${medistock.mail.app-url:http://localhost:5173}")
    private String appBaseUrl;

    @Value("${medistock.mail.from-name:MediStock Pharmacy Inventory}")
    private String brandName;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    /**
     * Renders responsive HTML email for a given template and data model.
     */
    public String renderEmail(String templateName, String recipientName, String subject, Map<String, Object> data) {
        String safeRecipient = escapeHtml(recipientName != null && !recipientName.isBlank() ? recipientName : "Valued Team Member");
        String safeSubject = escapeHtml(subject);
        String timestamp = LocalDateTime.now().format(DATE_FMT);

        StringBuilder bodyHtml = new StringBuilder();
        String ctaUrl = appBaseUrl;
        String ctaText = "Open MediStock Portal";
        String statusBadgeHtml = "";

        switch (templateName != null ? templateName.toUpperCase() : "GENERAL") {
            case "PURCHASE_ORDER":
                ctaUrl = appBaseUrl + "/admin/purchases";
                ctaText = "Review Purchase Order";
                renderPurchaseOrderContent(bodyHtml, data);
                statusBadgeHtml = renderBadge((String) data.getOrDefault("status", "PENDING_APPROVAL"), (String) data.getOrDefault("badgeVariant", "primary"));
                break;

            case "INVENTORY_ALERT":
                ctaUrl = appBaseUrl + "/pharmacist/medicines";
                ctaText = "View Medicine Stock";
                renderInventoryAlertContent(bodyHtml, data);
                statusBadgeHtml = renderBadge((String) data.getOrDefault("severity", "HIGH ALERT"), "danger");
                break;

            case "EXPIRY_FEFO":
                ctaUrl = appBaseUrl + "/pharmacist/medicines";
                ctaText = "Check FEFO Allocation";
                renderExpiryFefoContent(bodyHtml, data);
                statusBadgeHtml = renderBadge((String) data.getOrDefault("alertType", "EXPIRING SOON"), "warning");
                break;

            case "TASK_ASSIGNMENT":
                ctaUrl = appBaseUrl + "/staff/stock-check";
                ctaText = "View Assigned Task";
                renderTaskContent(bodyHtml, data);
                statusBadgeHtml = renderBadge((String) data.getOrDefault("priority", "NORMAL"), "info");
                break;

            case "FEEDBACK_UPDATE":
                ctaUrl = appBaseUrl + "/admin/feedback";
                ctaText = "Open Support Ticket";
                renderFeedbackContent(bodyHtml, data);
                statusBadgeHtml = renderBadge((String) data.getOrDefault("status", "UPDATED"), "primary");
                break;

            case "SUPPLIER_DELIVERY":
                ctaUrl = appBaseUrl + "/supplier/orders";
                ctaText = "Access Supplier Portal";
                renderSupplierContent(bodyHtml, data);
                statusBadgeHtml = renderBadge((String) data.getOrDefault("status", "ORDER PLACED"), "warning");
                break;

            case "DAILY_DIGEST":
                ctaUrl = appBaseUrl + "/admin";
                ctaText = "View Executive Dashboard";
                renderDailyDigestContent(bodyHtml, data);
                statusBadgeHtml = renderBadge("DAILY SUMMARY", "success");
                break;

            default:
                renderGeneralContent(bodyHtml, data);
                statusBadgeHtml = renderBadge("NOTIFICATION", "info");
                break;
        }

        return wrapMasterTemplate(safeSubject, safeRecipient, statusBadgeHtml, bodyHtml.toString(), ctaUrl, ctaText, timestamp);
    }

    private void renderPurchaseOrderContent(StringBuilder sb, Map<String, Object> data) {
        String poNumber = escapeHtml(String.valueOf(data.getOrDefault("poNumber", data.getOrDefault("orderId", "PO-NEW"))));
        String supplier = escapeHtml(String.valueOf(data.getOrDefault("supplierName", "Assigned Supplier")));
        String total = escapeHtml(String.valueOf(data.getOrDefault("totalAmount", "0.00")));
        String note = escapeHtml(String.valueOf(data.getOrDefault("notes", "No additional notes provided.")));
        String requestedBy = escapeHtml(String.valueOf(data.getOrDefault("requestedBy", "Pharmacist")));

        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>")
          .append("A purchase order transaction has generated an operational notification for your role in the MediStock procurement chain.")
          .append("</p>");

        sb.append("<table style='width:100%; border-collapse:collapse; margin:20px 0; background:#f8fafc; border-radius:8px; overflow:hidden;'>");
        appendRow(sb, "Purchase Order #", poNumber);
        appendRow(sb, "Supplier / Vendor", supplier);
        appendRow(sb, "Requested By", requestedBy);
        appendRow(sb, "Total Order Value", "$" + total);
        appendRow(sb, "Order Notes / Reason", note);
        sb.append("</table>");
    }

    private void renderInventoryAlertContent(StringBuilder sb, Map<String, Object> data) {
        String medName = escapeHtml(String.valueOf(data.getOrDefault("medicineName", "Medicine")));
        String batch = escapeHtml(String.valueOf(data.getOrDefault("batchNumber", "N/A")));
        String currentStock = escapeHtml(String.valueOf(data.getOrDefault("currentStock", "0")));
        String threshold = escapeHtml(String.valueOf(data.getOrDefault("threshold", "50")));
        String category = escapeHtml(String.valueOf(data.getOrDefault("category", "General")));

        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>")
          .append("Safety inventory monitoring has detected stock levels below the configured critical safety threshold. Immediate procurement or restocking is recommended.")
          .append("</p>");

        sb.append("<table style='width:100%; border-collapse:collapse; margin:20px 0; background:#f8fafc; border-radius:8px; overflow:hidden;'>");
        appendRow(sb, "Medicine Name", medName);
        appendRow(sb, "Category", category);
        appendRow(sb, "Batch Number", batch);
        appendRow(sb, "Current Available Stock", "<span style='color:#dc2626; font-weight:bold;'>" + currentStock + " units</span>");
        appendRow(sb, "Safety Minimum Threshold", threshold + " units");
        sb.append("</table>");
    }

    private void renderExpiryFefoContent(StringBuilder sb, Map<String, Object> data) {
        String medName = escapeHtml(String.valueOf(data.getOrDefault("medicineName", "Medicine")));
        String batch = escapeHtml(String.valueOf(data.getOrDefault("batchNumber", "N/A")));
        String expiryDate = escapeHtml(String.valueOf(data.getOrDefault("expiryDate", "N/A")));
        String daysRemaining = escapeHtml(String.valueOf(data.getOrDefault("daysRemaining", "0")));
        String actionAdvice = escapeHtml(String.valueOf(data.getOrDefault("actionAdvice", "Follow First Expiry, First Out (FEFO) dispensing protocol.")));

        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>")
          .append("The First Expiry, First Out (FEFO) intelligence monitor has flagged an expiring inventory batch. Please adhere to dispensing priority rules.")
          .append("</p>");

        sb.append("<table style='width:100%; border-collapse:collapse; margin:20px 0; background:#f8fafc; border-radius:8px; overflow:hidden;'>");
        appendRow(sb, "Medicine Item", medName);
        appendRow(sb, "Batch Number", batch);
        appendRow(sb, "Expiry Date", expiryDate);
        appendRow(sb, "Remaining Shelf Life", "<span style='color:#d97706; font-weight:bold;'>" + daysRemaining + " days</span>");
        appendRow(sb, "FEFO Directive", actionAdvice);
        sb.append("</table>");
    }

    private void renderTaskContent(StringBuilder sb, Map<String, Object> data) {
        String title = escapeHtml(String.valueOf(data.getOrDefault("title", "Inventory Task")));
        String priority = escapeHtml(String.valueOf(data.getOrDefault("priority", "NORMAL")));
        String dueDate = escapeHtml(String.valueOf(data.getOrDefault("dueDate", "Today")));
        String assignedBy = escapeHtml(String.valueOf(data.getOrDefault("assignedBy", "Supervisor")));
        String desc = escapeHtml(String.valueOf(data.getOrDefault("description", "Perform physical stock check and shelf audit.")));

        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>")
          .append("A hospital inventory task has been assigned to you. Please complete it within the designated operational deadline.")
          .append("</p>");

        sb.append("<table style='width:100%; border-collapse:collapse; margin:20px 0; background:#f8fafc; border-radius:8px; overflow:hidden;'>");
        appendRow(sb, "Task Subject", title);
        appendRow(sb, "Priority Level", priority);
        appendRow(sb, "Assigned By", assignedBy);
        appendRow(sb, "Due Date", dueDate);
        appendRow(sb, "Instructions", desc);
        sb.append("</table>");
    }

    private void renderFeedbackContent(StringBuilder sb, Map<String, Object> data) {
        String ticketNo = escapeHtml(String.valueOf(data.getOrDefault("ticketNumber", "MED-FB-TICKET")));
        String title = escapeHtml(String.valueOf(data.getOrDefault("ticketTitle", "Support Request")));
        String status = escapeHtml(String.valueOf(data.getOrDefault("status", "IN_PROGRESS")));
        String message = escapeHtml(String.valueOf(data.getOrDefault("message", "A new update has been logged on your ticket.")));

        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>")
          .append("An update has occurred on support ticket <strong>").append(ticketNo).append("</strong> in the MediStock feedback resolution system.")
          .append("</p>");

        sb.append("<table style='width:100%; border-collapse:collapse; margin:20px 0; background:#f8fafc; border-radius:8px; overflow:hidden;'>");
        appendRow(sb, "Ticket Reference", ticketNo);
        appendRow(sb, "Subject", title);
        appendRow(sb, "Current Status", status);
        appendRow(sb, "Latest Communication", message);
        sb.append("</table>");
    }

    private void renderSupplierContent(StringBuilder sb, Map<String, Object> data) {
        String poNumber = escapeHtml(String.valueOf(data.getOrDefault("poNumber", data.getOrDefault("orderId", "PO-NEW"))));
        String total = escapeHtml(String.valueOf(data.getOrDefault("totalAmount", "0.00")));
        String deliveryDate = escapeHtml(String.valueOf(data.getOrDefault("expectedDelivery", "Within 3 business days")));
        String instructions = escapeHtml(String.valueOf(data.getOrDefault("instructions", "Deliver to Hospital Central Receiving Bay with delivery invoice.")));

        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>")
          .append("MediStock Pharmacy has issued or updated a medical supply purchase order designated for your organization.")
          .append("</p>");

        sb.append("<table style='width:100%; border-collapse:collapse; margin:20px 0; background:#f8fafc; border-radius:8px; overflow:hidden;'>");
        appendRow(sb, "Purchase Order #", poNumber);
        appendRow(sb, "Order Value", "$" + total);
        appendRow(sb, "Expected Receiving Date", deliveryDate);
        appendRow(sb, "Receiving Bay Instructions", instructions);
        sb.append("</table>");
    }

    private void renderDailyDigestContent(StringBuilder sb, Map<String, Object> data) {
        String totalMed = escapeHtml(String.valueOf(data.getOrDefault("totalMedicines", "1,240")));
        String lowStock = escapeHtml(String.valueOf(data.getOrDefault("lowStockCount", "4")));
        String expiring = escapeHtml(String.valueOf(data.getOrDefault("expiringCount", "7")));
        String pendingOrders = escapeHtml(String.valueOf(data.getOrDefault("pendingOrdersCount", "3")));

        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>")
          .append("Here is your daily pharmacy operations digest summarizing current stock health, pending orders, and compliance indicators.")
          .append("</p>");

        sb.append("<table style='width:100%; border-collapse:collapse; margin:20px 0; background:#f8fafc; border-radius:8px; overflow:hidden;'>");
        appendRow(sb, "Active Catalog Medicines", totalMed);
        appendRow(sb, "Batches in Low Stock", "<span style='color:#dc2626; font-weight:bold;'>" + lowStock + "</span>");
        appendRow(sb, "Batches Expiring in <= 30 Days", "<span style='color:#d97706; font-weight:bold;'>" + expiring + "</span>");
        appendRow(sb, "Purchase Orders Awaiting Review", pendingOrders);
        sb.append("</table>");
    }

    private void renderGeneralContent(StringBuilder sb, Map<String, Object> data) {
        String message = escapeHtml(String.valueOf(data.getOrDefault("message", "You have received an automated notification from MediStock.")));
        sb.append("<p style='font-size:15px; color:#334155; line-height:1.6;'>").append(message).append("</p>");
    }

    private void appendRow(StringBuilder sb, String label, String value) {
        sb.append("<tr style='border-bottom:1px solid #e2e8f0;'>")
          .append("<td style='padding:12px 16px; font-size:14px; font-weight:600; color:#475569; width:35%;'>")
          .append(label)
          .append("</td>")
          .append("<td style='padding:12px 16px; font-size:14px; color:#1e293b;'>")
          .append(value)
          .append("</td>")
          .append("</tr>");
    }

    private String renderBadge(String text, String variant) {
        String bg = "#e2e8f0";
        String color = "#334155";

        if ("danger".equalsIgnoreCase(variant)) {
            bg = "#fee2e2";
            color = "#dc2626";
        } else if ("warning".equalsIgnoreCase(variant)) {
            bg = "#fef3c7";
            color = "#d97706";
        } else if ("success".equalsIgnoreCase(variant)) {
            bg = "#dcfce7";
            color = "#16a34a";
        } else if ("primary".equalsIgnoreCase(variant)) {
            bg = "#e0f2fe";
            color = "#0284c7";
        } else if ("info".equalsIgnoreCase(variant)) {
            bg = "#e0e7ff";
            color = "#4f46e5";
        }

        return "<span style='display:inline-block; padding:4px 12px; border-radius:9999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; background:" + bg + "; color:" + color + ";'>" + escapeHtml(text) + "</span>";
    }

    private String wrapMasterTemplate(String subject, String recipient, String statusBadge, String bodyHtml, String ctaUrl, String ctaText, String timestamp) {
        return "<!DOCTYPE html>"
             + "<html lang='en'>"
             + "<head>"
             + "<meta charset='UTF-8'>"
             + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
             + "<title>" + subject + "</title>"
             + "</head>"
             + "<body style='margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color:#0f172a;'>"
             + "<table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background-color:#f1f5f9; padding:30px 15px;'>"
             + "<tr>"
             + "<td align='center'>"
             + "  <table role='presentation' width='100%' style='max-width:620px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04); border:1px solid #e2e8f0;'>"
             // Brand Header
             + "    <tr>"
             + "      <td style='background:linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%); padding:24px 30px; text-align:left;'>"
             + "        <table width='100%'><tr>"
             + "          <td>"
             + "            <div style='font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;'>✚ MEDISTOCK</div>"
             + "            <div style='font-size:12px; color:#e0f2fe; margin-top:3px; letter-spacing:0.5px; text-transform:uppercase;'>Pharmacy Inventory Management System</div>"
             + "          </td>"
             + "          <td align='right'>" + statusBadge + "</td>"
             + "        </tr></table>"
             + "      </td>"
             + "    </tr>"
             // Main Card Body
             + "    <tr>"
             + "      <td style='padding:32px 30px;'>"
             + "        <h2 style='margin:0 0 12px 0; font-size:20px; font-weight:700; color:#0f172a;'>" + subject + "</h2>"
             + "        <div style='font-size:14px; color:#64748b; margin-bottom:20px;'>Hello <strong>" + recipient + "</strong>,</div>"
             + bodyHtml
             // Call To Action Button
             + "        <div style='text-align:center; margin:32px 0 10px 0;'>"
             + "          <a href='" + ctaUrl + "' target='_blank' style='display:inline-block; padding:13px 28px; background:linear-gradient(135deg, #0ea5e9, #0284c7); color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; border-radius:10px; box-shadow:0 4px 12px rgba(14, 165, 233, 0.35);'> " + ctaText + " &rarr;</a>"
             + "        </div>"
             + "      </td>"
             + "    </tr>"
             // Footer
             + "    <tr>"
             + "      <td style='background-color:#f8fafc; padding:20px 30px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b; line-height:1.5; text-align:center;'>"
             + "        <div>Generated at <strong>" + timestamp + "</strong> &bull; MediStock Automated SMTP Transmission</div>"
             + "        <div style='margin-top:8px;'>You received this operational email according to your role preferences. To adjust settings, visit <a href='" + appBaseUrl + "/admin/notifications' style='color:#0284c7; text-decoration:none;'>Notification Preferences</a>.</div>"
             + "        <div style='margin-top:6px; color:#94a3b8;'>CONFIDENTIAL: This message contains medical inventory and procurement data intended solely for designated hospital staff.</div>"
             + "      </td>"
             + "    </tr>"
             + "  </table>"
             + "</td>"
             + "</tr>"
             + "</table>"
             + "</body>"
             + "</html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}

