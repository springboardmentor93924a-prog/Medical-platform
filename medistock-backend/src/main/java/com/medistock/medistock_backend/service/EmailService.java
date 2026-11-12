package com.medistock.medistock_backend.service;

import java.util.List;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from-address:noreply@medistock.com}")
    private String fromAddress;

    @Value("${app.email.from-name:MediStock}")
    private String fromName;

    @Value("${app.email.admin-email:admin@medistock.com}")
    private String adminEmail;

    // ==========================================
    // 1. WELCOME EMAIL TO NEW SUPPLIER
    // ==========================================
    @Async
    public void sendSupplierWelcomeEmail(String supplierEmail, String supplierName, String contactPerson, String rawPassword) {
        if (!emailEnabled) {
            System.out.println("📭 Email disabled — skipping welcome email to " + supplierEmail);
            return;
        }
        String displayName = (contactPerson != null && !contactPerson.isBlank()) ? contactPerson : supplierName;
        String subject = "Welcome to MediStock — Your Supplier Account is Ready";
        String html = buildSupplierWelcomeHtml(displayName, supplierEmail, rawPassword);
        sendHtml(supplierEmail, subject, html);
    }

    // ==========================================
    // 2. PO APPROVED → NOTIFY SUPPLIER
    // ==========================================
    @Async
    public void sendPoApprovedEmail(String supplierEmail, String supplierName, String orderNumber, String totalAmount, int itemCount) {
        if (!emailEnabled) return;
        String subject = "Purchase Order " + orderNumber + " Approved — Ready for Delivery";
        String html = buildPoApprovedHtml(supplierName, orderNumber, totalAmount, itemCount);
        sendHtml(supplierEmail, subject, html);
    }

    // ==========================================
    // 3. NEW PO → NOTIFY ADMIN
    // ==========================================
    @Async
    public void sendNewPoAdminAlert(String poNumber, String requestedBy, String supplierName, String totalAmount, int itemCount) {
        if (!emailEnabled) return;
        String subject = "New Purchase Order Pending Approval — " + poNumber;
        String html = buildNewPoAdminHtml(poNumber, requestedBy, supplierName, totalAmount, itemCount);
        sendHtml(adminEmail, subject, html);
    }

    // ==========================================
    // SEND HELPER
    // ==========================================
    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            System.out.println("✅ Email sent to " + to + " — " + subject);
        } catch (Exception e) {
            System.err.println("❌ Email send failed to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ==========================================
    // TEMPLATES — using .replace() to avoid % parsing
    // ==========================================
    private String buildSupplierWelcomeHtml(String displayName, String email, String password) {
        String template = """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f7fb;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr><td style="background:linear-gradient(135deg,#0f9488,#2dd4bf);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;">Welcome to MediStock</h1>
                      <p style="margin:8px 0 0;color:#d1fae5;font-size:14px;">Your supplier account is ready</p>
                    </td></tr>
                    <tr><td style="padding:32px;">
                      <p style="margin:0 0 16px;color:#172b3a;font-size:16px;">Hi <strong>__NAME__</strong>,</p>
                      <p style="margin:0 0 24px;color:#617386;font-size:14px;line-height:1.6;">Your supplier account has been created by our admin team. Below are your login credentials:</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eaf3f5;border-radius:12px;padding:20px;margin-bottom:24px;">
                        <tr><td style="padding:8px 16px;">
                          <p style="margin:0 0 4px;color:#617386;font-size:11px;font-weight:600;text-transform:uppercase;">Email</p>
                          <p style="margin:0;color:#0f9488;font-size:15px;font-family:monospace;font-weight:600;">__EMAIL__</p>
                        </td></tr>
                        <tr><td style="padding:8px 16px;">
                          <p style="margin:0 0 4px;color:#617386;font-size:11px;font-weight:600;text-transform:uppercase;">Temporary Password</p>
                          <p style="margin:0;color:#0f9488;font-size:15px;font-family:monospace;font-weight:600;">__PASSWORD__</p>
                        </td></tr>
                      </table>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="http://localhost:5173/login" style="display:inline-block;background:#0f9488;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Log In to MediStock</a>
                      </div>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
        return template
                .replace("__NAME__", displayName)
                .replace("__EMAIL__", email)
                .replace("__PASSWORD__", password);
    }

    private String buildPoApprovedHtml(String supplierName, String orderNumber, String totalAmount, int itemCount) {
        String template = """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f7fb;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr><td style="background:linear-gradient(135deg,#2563eb,#3b82f6);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;">Purchase Order Approved</h1>
                    </td></tr>
                    <tr><td style="padding:32px;">
                      <p style="margin:0 0 16px;color:#172b3a;font-size:16px;">Hi <strong>__NAME__</strong>,</p>
                      <p style="margin:0 0 24px;color:#617386;font-size:14px;line-height:1.6;">Purchase order <strong>__ORDER__</strong> has been approved. Please prepare the shipment.</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;padding:20px;">
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">PO Number: <strong>__ORDER__</strong></td></tr>
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">Total: <strong>Rs __TOTAL__</strong></td></tr>
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">Items: <strong>__COUNT__</strong></td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
        return template
                .replace("__NAME__", supplierName)
                .replace("__ORDER__", orderNumber)
                .replace("__TOTAL__", totalAmount)
                .replace("__COUNT__", String.valueOf(itemCount));
    }

    private String buildNewPoAdminHtml(String poNumber, String requestedBy, String supplierName, String totalAmount, int itemCount) {
        String template = """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f7fb;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr><td style="background:linear-gradient(135deg,#f59e0b,#fbbf24);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;">New Purchase Order</h1>
                    </td></tr>
                    <tr><td style="padding:32px;">
                      <p style="margin:0 0 16px;color:#172b3a;font-size:16px;">Hi Admin,</p>
                      <p style="margin:0 0 24px;color:#617386;font-size:14px;line-height:1.6;">A new purchase order needs your approval:</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:12px;padding:20px;">
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">PO: <strong>__PO__</strong></td></tr>
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">By: <strong>__REQUESTER__</strong></td></tr>
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">Supplier: <strong>__SUPPLIER__</strong></td></tr>
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">Total: <strong>Rs __TOTAL__</strong></td></tr>
                        <tr><td style="padding:6px 16px;color:#617386;font-size:13px;">Items: <strong>__COUNT__</strong></td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
        return template
                .replace("__PO__", poNumber)
                .replace("__REQUESTER__", requestedBy)
                .replace("__SUPPLIER__", supplierName)
                .replace("__TOTAL__", totalAmount)
                .replace("__COUNT__", String.valueOf(itemCount));
    }

    // ==========================================
    // 4. LOW STOCK DIGEST
    // ==========================================
    @Async
    public void sendLowStockDigest(
            List<String> recipients,
            List<LowStockItem> lowStockItems
    ) {
        if (!emailEnabled || lowStockItems.isEmpty()) return;
        if (recipients == null || recipients.isEmpty()) return;

        String subject = "⚠️ Low Stock Alert — " + lowStockItems.size() + " medicines need restock";
        String html = buildLowStockDigestHtml(lowStockItems);

        for (String recipient : recipients) {
            if (recipient != null && !recipient.isBlank()) {
                sendHtml(recipient, subject, html);
            }
        }
    }

    public static class LowStockItem {
        public String name;
        public String batchNumber;
        public int currentQty;
        public int minQty;
        public String supplierName;

        public LowStockItem(String name, String batchNumber, int currentQty, int minQty, String supplierName) {
            this.name = name;
            this.batchNumber = batchNumber;
            this.currentQty = currentQty;
            this.minQty = minQty;
            this.supplierName = supplierName;
        }
    }

    private String buildLowStockDigestHtml(List<LowStockItem> items) {
        StringBuilder rows = new StringBuilder();
        for (LowStockItem item : items) {
            String severity = item.currentQty == 0 ? "OUT OF STOCK" : "LOW";
            String color = item.currentQty == 0 ? "#dc2626" : "#f59e0b";
            rows.append("""
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#172b3a;font-size:13px;">
                    <strong>__NAME__</strong><br/>
                    <span style="color:#617386;font-size:11px;font-family:monospace;">Batch: __BATCH__</span>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;color:__COLOR__;font-weight:700;font-size:14px;">__QTY__</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;color:#617386;font-size:13px;">__MIN__</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    <span style="background:__COLOR__;color:#fff;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;">__SEVERITY__</span>
                  </td>
                </tr>
                """
                    .replace("__NAME__", item.name)
                    .replace("__BATCH__", item.batchNumber != null ? item.batchNumber : "N/A")
                    .replace("__QTY__", String.valueOf(item.currentQty))
                    .replace("__MIN__", String.valueOf(item.minQty))
                    .replace("__SEVERITY__", severity)
                    .replace("__COLOR__", color)
            );
        }

        String template = """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f7fb;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr><td align="center">
                  <table width="700" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr><td style="background:linear-gradient(135deg,#f59e0b,#dc2626);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;">⚠️ Low Stock Alert</h1>
                      <p style="margin:8px 0 0;color:#fef3c7;font-size:14px;">__COUNT__ medicines need immediate restock</p>
                    </td></tr>
                    <tr><td style="padding:32px;">
                      <p style="margin:0 0 16px;color:#172b3a;font-size:16px;">Hi Team,</p>
                      <p style="margin:0 0 24px;color:#617386;font-size:14px;line-height:1.6;">
                        The following medicines have fallen below their minimum stock threshold. Please create purchase orders to replenish.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                        <thead>
                          <tr style="background:#f9fafb;">
                            <th style="padding:10px 16px;text-align:left;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Medicine</th>
                            <th style="padding:10px 16px;text-align:center;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Current</th>
                            <th style="padding:10px 16px;text-align:center;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Min</th>
                            <th style="padding:10px 16px;text-align:center;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          __ROWS__
                        </tbody>
                      </table>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="http://localhost:5173/login" style="display:inline-block;background:#f59e0b;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Create Purchase Order</a>
                      </div>
                    </td></tr>
                    <tr><td style="background:#f4f7fb;padding:20px 32px;text-align:center;border-top:1px solid #dfe7ef;">
                      <p style="margin:0;color:#a3b3c7;font-size:11px;">This is an automated low-stock digest from MediStock.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        return template
                .replace("__COUNT__", String.valueOf(items.size()))
                .replace("__ROWS__", rows.toString());
    }


    // ==========================================
    // 5. EXPIRY WARNING DIGEST
    // ==========================================
    @Async
    public void sendExpiryWarningDigest(List<String> recipients, List<ExpiringItem> expiringItems) {
        if (!emailEnabled || expiringItems.isEmpty()) return;
        if (recipients == null || recipients.isEmpty()) return;

        String subject = "⏳ Expiry Warning — " + expiringItems.size() + " medicines expiring soon";
        String html = buildExpiryWarningHtml(expiringItems);

        for (String recipient : recipients) {
            if (recipient != null && !recipient.isBlank()) {
                sendHtml(recipient, subject, html);
            }
        }
    }

    public static class ExpiringItem {
        public String name;
        public String batchNumber;
        public String expiryDate;
        public int quantity;
        public long daysRemaining;

        public ExpiringItem(String name, String batchNumber, String expiryDate, int quantity, long daysRemaining) {
            this.name = name;
            this.batchNumber = batchNumber;
            this.expiryDate = expiryDate;
            this.quantity = quantity;
            this.daysRemaining = daysRemaining;
        }
    }

    private String buildExpiryWarningHtml(List<ExpiringItem> items) {
        StringBuilder rows = new StringBuilder();
        for (ExpiringItem item : items) {
            String color = item.daysRemaining <= 30 ? "#dc2626" : "#f59e0b";
            String label = item.daysRemaining < 0 ? "EXPIRED" : item.daysRemaining + " days";
            rows.append("""
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#172b3a;font-size:13px;">
                    <strong>__NAME__</strong><br/>
                    <span style="color:#617386;font-size:11px;font-family:monospace;">Batch: __BATCH__</span>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#617386;font-size:13px;">__DATE__</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;color:__COLOR__;font-weight:700;font-size:13px;">__LABEL__</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;color:#172b3a;font-weight:600;font-size:13px;">__QTY__</td>
                </tr>
                """
                    .replace("__NAME__", item.name)
                    .replace("__BATCH__", item.batchNumber != null ? item.batchNumber : "N/A")
                    .replace("__DATE__", item.expiryDate)
                    .replace("__LABEL__", label)
                    .replace("__COLOR__", color)
                    .replace("__QTY__", String.valueOf(item.quantity))
            );
        }

        String template = """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f7fb;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr><td align="center">
                  <table width="700" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr><td style="background:linear-gradient(135deg,#dc2626,#f59e0b);padding:32px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;">⏳ Expiry Warning</h1>
                      <p style="margin:8px 0 0;color:#fee2e2;font-size:14px;">__COUNT__ medicines expiring within 45 days</p>
                    </td></tr>
                    <tr><td style="padding:32px;">
                      <p style="margin:0 0 16px;color:#172b3a;font-size:16px;">Hi Team,</p>
                      <p style="margin:0 0 24px;color:#617386;font-size:14px;line-height:1.6;">
                        The following medicines are approaching expiry. Prioritize them for dispensing using FEFO, or initiate a wastage report if they're about to expire.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                        <thead>
                          <tr style="background:#f9fafb;">
                            <th style="padding:10px 16px;text-align:left;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Medicine</th>
                            <th style="padding:10px 16px;text-align:left;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Expiry Date</th>
                            <th style="padding:10px 16px;text-align:center;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Remaining</th>
                            <th style="padding:10px 16px;text-align:center;color:#617386;font-size:11px;font-weight:700;text-transform:uppercase;">Qty</th>
                          </tr>
                        </thead>
                        <tbody>__ROWS__</tbody>
                      </table>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="http://localhost:5173/login" style="display:inline-block;background:#dc2626;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Review Expiry Items</a>
                      </div>
                    </td></tr>
                    <tr><td style="background:#f4f7fb;padding:20px 32px;text-align:center;border-top:1px solid #dfe7ef;">
                      <p style="margin:0;color:#a3b3c7;font-size:11px;">This is an automated expiry digest from MediStock.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        return template
                .replace("__COUNT__", String.valueOf(items.size()))
                .replace("__ROWS__", rows.toString());
    }
}