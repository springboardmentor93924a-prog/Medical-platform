package com.medistock.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.medistock.dto.backup.*;
import com.medistock.entity.*;
import com.medistock.enums.*;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.*;
import com.medistock.service.AuditLogService;
import com.medistock.service.BackupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BackupServiceImpl implements BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupServiceImpl.class);

    private final BackupRecordRepository backupRecordRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockMovementRepository stockMovementRepository;
    private final WastageReportRepository wastageReportRepository;
    private final FeedbackRepository feedbackRepository;
    private final NotificationRepository notificationRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Value("${app.backup.enabled:true}")
    private boolean scheduledBackupEnabled;

    public BackupServiceImpl(BackupRecordRepository backupRecordRepository,
                             UserRepository userRepository,
                             CategoryRepository categoryRepository,
                             SupplierRepository supplierRepository,
                             MedicineRepository medicineRepository,
                             PurchaseOrderRepository purchaseOrderRepository,
                             StockMovementRepository stockMovementRepository,
                             WastageReportRepository wastageReportRepository,
                             FeedbackRepository feedbackRepository,
                             NotificationRepository notificationRepository,
                             SystemSettingRepository systemSettingRepository,
                             AuditLogService auditLogService) {
        this.backupRecordRepository = backupRecordRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.wastageReportRepository = wastageReportRepository;
        this.feedbackRepository = feedbackRepository;
        this.notificationRepository = notificationRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.auditLogService = auditLogService;

        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Value("${app.backup.dir:}")
    private String configuredBackupDir;

    private Path getBackupDirectory() {
        Path path;
        if (configuredBackupDir != null && !configuredBackupDir.isBlank()) {
            path = Paths.get(configuredBackupDir);
        } else {
            path = Paths.get(System.getProperty("user.dir"), "backups");
        }
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            logger.warn("Could not create preferred backup directory {}, falling back to temp dir: {}", path, e.getMessage());
            path = Paths.get(System.getProperty("java.io.tmpdir"), "medistock_backups");
            try {
                if (!Files.exists(path)) {
                    Files.createDirectories(path);
                }
            } catch (IOException ex) {
                logger.error("Could not initialize fallback backup storage directory: {}", ex.getMessage());
            }
        }
        return path;
    }

    @Scheduled(cron = "${app.backup.cron:0 0 2 * * ?}")
    public void runScheduledBackup() {
        if (!scheduledBackupEnabled) {
            logger.info("Automatic database backup scheduler is currently disabled.");
            return;
        }

        logger.info("Executing scheduled automatic database backup...");
        try {
            List<User> admins = userRepository.findAllByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE);
            String adminEmail = !admins.isEmpty() ? admins.get(0).getEmail() : "admin@medistock.com";
            BackupRecord record = createBackup(adminEmail);
            logger.info("Automatic scheduled backup successfully generated: {} ({} bytes)", record.getFileName(), record.getFileSizeBytes());
        } catch (Exception e) {
            logger.error("Error during automatic scheduled database backup: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public BackupRecord createBackup(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseGet(() -> {
                    List<User> admins = userRepository.findAllByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE);
                    return !admins.isEmpty() ? admins.get(0) : null;
                });

        if (admin == null) {
            throw new ResourceNotFoundException("No authorized administrator account available to associate with backup.");
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "medistock_backup_" + timestamp + ".json";
        Path backupPath = getBackupDirectory().resolve(fileName);

        SystemBackupSnapshot snapshot = new SystemBackupSnapshot();
        snapshot.setAppVersion("1.0.0");
        snapshot.setSnapshotVersion(1);
        snapshot.setTimestamp(LocalDateTime.now());
        snapshot.setCreatedBy(admin.getEmail());

        // 1. Categories
        List<Category> categories = categoryRepository.findAll();
        for (Category c : categories) {
            snapshot.getCategories().add(new CategorySnapshot(c.getId(), c.getName(), c.getDescription(), c.getCreatedAt()));
        }

        // 2. Suppliers
        List<Supplier> suppliers = supplierRepository.findAll();
        for (Supplier s : suppliers) {
            String userEmail = s.getUser() != null ? s.getUser().getEmail() : null;
            String status = s.getStatus() != null ? s.getStatus().name() : "APPROVED";
            snapshot.getSuppliers().add(new SupplierSnapshot(s.getId(), s.getCompanyName(), s.getContactPerson(),
                    s.getEmail(), s.getPhone(), s.getAddress(), s.getBusinessRegistrationNumber(), status, 5.0, userEmail, s.getCreatedAt()));
        }

        // 3. Users
        List<User> users = userRepository.findAll();
        for (User u : users) {
            String role = u.getRole() != null ? u.getRole().name() : "STAFF";
            String status = u.getStatus() != null ? u.getStatus().name() : "ACTIVE";
            snapshot.getUsers().add(new UserSnapshot(u.getId(), u.getFullName(), u.getEmail(), u.getPassword(), role, status, u.getPhone(), u.getCreatedAt()));
        }

        // 4. Medicines
        List<Medicine> medicines = medicineRepository.findAll();
        for (Medicine m : medicines) {
            String catName = m.getCategory() != null ? m.getCategory().getName() : null;
            String supName = m.getSupplier() != null ? m.getSupplier().getCompanyName() : null;
            String status = m.getStatus() != null ? m.getStatus().name() : "ACTIVE";
            snapshot.getMedicines().add(new MedicineSnapshot(m.getId(), m.getName(), m.getGenericName(), m.getBatchNumber(),
                    catName, supName, m.getQuantity(), m.getMinimumStockLevel(), m.getUnitPrice(), m.getDosageForm(),
                    m.getStorageConditions(), m.getManufacturingDate(), m.getExpiryDate(), m.getDescription(), status, m.getCreatedAt()));
        }

        // 5. Purchase Orders
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findAll();
        for (PurchaseOrder po : purchaseOrders) {
            PurchaseOrderSnapshot poSnap = new PurchaseOrderSnapshot();
            poSnap.setId(po.getId());
            poSnap.setOrderNumber(po.getPoNumber());
            poSnap.setSupplierCompanyName(po.getSupplier() != null ? po.getSupplier().getCompanyName() : null);
            poSnap.setCreatedByEmail(po.getCreatedBy() != null ? po.getCreatedBy().getEmail() : null);
            poSnap.setApprovedByEmail(po.getApprovedBy() != null ? po.getApprovedBy().getEmail() : null);
            poSnap.setOrderStatus(po.getOrderStatus() != null ? po.getOrderStatus().name() : "DRAFT");
            poSnap.setTotalAmount(po.getTotalAmount());
            poSnap.setOrderDate(po.getOrderDate());
            poSnap.setExpectedDeliveryDate(po.getExpectedDeliveryDate());
            poSnap.setActualDeliveryDate(po.getActualDeliveryDate());
            poSnap.setNotes(po.getNotes());
            poSnap.setRejectionReason(po.getNotes());
            poSnap.setCreatedAt(po.getCreatedAt());

            if (po.getItems() != null) {
                for (PurchaseOrderItem item : po.getItems()) {
                    String medName = item.getMedicine() != null ? item.getMedicine().getName() : null;
                    String medBatch = item.getMedicine() != null ? item.getMedicine().getBatchNumber() : null;
                    poSnap.getItems().add(new PurchaseOrderItemSnapshot(item.getId(), medName, medBatch,
                            item.getRequestedQuantity(), item.getReceivedQuantity(), item.getUnitPrice(), item.getSubtotal()));
                }
            }
            snapshot.getPurchaseOrders().add(poSnap);
        }

        // 6. Stock Movements
        List<StockMovement> stockMovements = stockMovementRepository.findAll();
        for (StockMovement sm : stockMovements) {
            StockMovementSnapshot smSnap = new StockMovementSnapshot();
            smSnap.setId(sm.getId());
            smSnap.setMedicineName(sm.getMedicine() != null ? sm.getMedicine().getName() : null);
            smSnap.setMedicineBatch(sm.getMedicine() != null ? sm.getMedicine().getBatchNumber() : null);
            smSnap.setMovementType(sm.getMovementType() != null ? sm.getMovementType().name() : "ADJUSTMENT");
            smSnap.setQuantity(sm.getQuantity());
            smSnap.setReason(sm.getReason());
            smSnap.setReferenceNumber(sm.getReferenceNumber());
            smSnap.setPerformedByEmail(sm.getPerformedBy() != null ? sm.getPerformedBy().getEmail() : null);
            smSnap.setCreatedAt(sm.getCreatedAt());
            snapshot.getStockMovements().add(smSnap);
        }

        // 7. Wastage Reports
        List<WastageReport> wastageReports = wastageReportRepository.findAll();
        for (WastageReport w : wastageReports) {
            WastageReportSnapshot wSnap = new WastageReportSnapshot();
            wSnap.setId(w.getId());
            wSnap.setMedicineName(w.getMedicine() != null ? w.getMedicine().getName() : null);
            wSnap.setBatchNumber(w.getBatchNumber());
            wSnap.setQuantityWasted(w.getQuantityWasted());
            wSnap.setWastageReason(w.getReason() != null ? w.getReason().name() : "EXPIRED");
            wSnap.setReportDate(w.getCreatedAt() != null ? w.getCreatedAt().toLocalDate() : LocalDate.now());
            wSnap.setReportedByEmail(w.getReportedBy() != null ? w.getReportedBy().getEmail() : null);
            wSnap.setStatus(w.getStatus() != null ? w.getStatus().name() : "SUBMITTED");
            wSnap.setReviewNotes(w.getReviewNotes());
            wSnap.setCreatedAt(w.getCreatedAt());
            snapshot.getWastageReports().add(wSnap);
        }

        // 8. Feedback
        List<Feedback> feedback = feedbackRepository.findAll();
        for (Feedback f : feedback) {
            FeedbackSnapshot fSnap = new FeedbackSnapshot();
            fSnap.setId(f.getId());
            fSnap.setUserEmail(f.getUser() != null ? f.getUser().getEmail() : null);
            fSnap.setSubject(f.getSubject());
            fSnap.setMessage(f.getMessage());
            fSnap.setRating(f.getRating());
            fSnap.setCategory(f.getCategory() != null ? f.getCategory().name() : "GENERAL");
            fSnap.setStatus(f.getStatus() != null ? f.getStatus().name() : "SUBMITTED");
            fSnap.setAdminResponse(f.getAdminResponse());
            fSnap.setCreatedAt(f.getCreatedAt());
            snapshot.getFeedback().add(fSnap);
        }

        // 9. Notifications
        List<Notification> notifications = notificationRepository.findAll();
        for (Notification n : notifications) {
            String recipientEmail = n.getRecipient() != null ? n.getRecipient().getEmail() : null;
            String targetRole = n.getTargetRole() != null ? n.getTargetRole().name() : null;
            String type = n.getType() != null ? n.getType().name() : "SYSTEM";
            snapshot.getNotifications().add(new NotificationSnapshot(n.getId(), recipientEmail, targetRole,
                    n.getTitle(), n.getMessage(), type, n.getNavigationUrl(), n.getIsRead(), n.getCreatedAt()));
        }

        // 10. System Settings
        List<SystemSetting> systemSettings = systemSettingRepository.findAll();
        for (SystemSetting ss : systemSettings) {
            snapshot.getSystemSettings().add(new SystemSettingSnapshot(ss.getSettingKey(), ss.getSettingValue(), ss.getDescription()));
        }

        int totalRecords = categories.size() + suppliers.size() + users.size() + medicines.size()
                + purchaseOrders.size() + stockMovements.size() + wastageReports.size() + feedback.size()
                + notifications.size() + systemSettings.size();
        snapshot.setTotalRecords(totalRecords);

        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("categories", categories.size());
        counts.put("suppliers", suppliers.size());
        counts.put("users", users.size());
        counts.put("medicines", medicines.size());
        counts.put("purchaseOrders", purchaseOrders.size());
        counts.put("stockMovements", stockMovements.size());
        counts.put("wastageReports", wastageReports.size());
        counts.put("feedback", feedback.size());
        counts.put("notifications", notifications.size());
        counts.put("systemSettings", systemSettings.size());
        counts.put("total", totalRecords);

        try {
            byte[] bytes = objectMapper.writeValueAsBytes(snapshot);
            String checksumSha256 = calculateSha256(bytes);
            snapshot.setChecksumSha256(checksumSha256);

            // Re-serialize with checksum included
            bytes = objectMapper.writeValueAsBytes(snapshot);
            Files.write(backupPath, bytes);

            String recordCountsJson = objectMapper.writeValueAsString(counts);
            BackupRecord record = new BackupRecord(fileName, backupPath.toString(), (long) bytes.length, "COMPLETED", recordCountsJson, checksumSha256, admin);
            BackupRecord saved = backupRecordRepository.save(record);

            auditLogService.log(admin.getEmail(), "ADMIN", "CREATE_BACKUP", "BackupRecord", saved.getId().toString(),
                    "Created database backup: " + fileName + " (" + bytes.length + " bytes, " + totalRecords + " records)");

            return saved;
        } catch (IOException e) {
            logger.error("Failed to generate database backup file", e);
            throw new BadRequestException("Failed to generate backup: " + e.getMessage());
        }
    }

    @Override
    public List<BackupRecord> getBackupHistory() {
        return backupRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Resource downloadBackup(Long id) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Backup record not found with ID: " + id));

        Path path = Paths.get(record.getFilePath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Physical backup file not found on server at: " + record.getFilePath());
        }

        try {
            byte[] data = Files.readAllBytes(path);
            return new ByteArrayResource(data) {
                @Override
                public String getFilename() {
                    return record.getFileName();
                }
            };
        } catch (IOException e) {
            throw new BadRequestException("Error reading backup file: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> restoreBackup(Long id, String adminEmail) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Backup record not found with ID: " + id));

        Path path = Paths.get(record.getFilePath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Backup file does not exist on disk: " + record.getFilePath());
        }

        try {
            byte[] data = Files.readAllBytes(path);
            return executeSafeRestore(data, "Restore from Backup #" + id + " (" + record.getFileName() + ")", adminEmail);
        } catch (IOException e) {
            throw new BadRequestException("Error accessing backup file: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> restoreFromUpload(MultipartFile file, String adminEmail) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded backup file is empty.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".json")) {
            throw new BadRequestException("Invalid backup format. Only authenticated JSON snapshots (.json) are accepted.");
        }

        try {
            byte[] data = file.getBytes();
            return executeSafeRestore(data, "Restore from uploaded file: " + filename, adminEmail);
        } catch (IOException e) {
            throw new BadRequestException("Failed to process backup file: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteBackup(Long id, String adminEmail) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Backup record not found with ID: " + id));

        try {
            if (record.getFilePath() != null) {
                Path path = Paths.get(record.getFilePath());
                Files.deleteIfExists(path);
            }
        } catch (IOException e) {
            logger.warn("Could not delete physical backup file at {}: {}", record.getFilePath(), e.getMessage());
        }

        backupRecordRepository.delete(record);

        auditLogService.log(adminEmail, "ADMIN", "DELETE_BACKUP", "BackupRecord", id.toString(),
                "Permanently deleted database backup snapshot: " + record.getFileName());
    }

    private Map<String, Object> executeSafeRestore(byte[] data, String sourceDescription, String adminEmail) {
        try {
            // 1. Validate structure and schema
            SystemBackupSnapshot snapshot = objectMapper.readValue(data, SystemBackupSnapshot.class);
            if (snapshot.getAppVersion() == null || snapshot.getMedicines() == null) {
                throw new BadRequestException("Invalid backup snapshot format. Missing required metadata or medicine records.");
            }

            // 2. Automatically generate emergency pre-restore safety snapshot before altering database
            BackupRecord preRestoreSnapshot = createBackup(adminEmail);
            logger.info("Pre-restore safety snapshot generated: #{} ({})", preRestoreSnapshot.getId(), preRestoreSnapshot.getFileName());

            // 3. Perform restoration with referential integrity mapping
            Map<String, Category> categoryMap = new HashMap<>();
            int restoredCategories = 0;
            if (snapshot.getCategories() != null) {
                for (CategorySnapshot cs : snapshot.getCategories()) {
                    if (cs.getName() != null && !cs.getName().isBlank()) {
                        Category cat = categoryRepository.findByNameIgnoreCase(cs.getName())
                                .orElseGet(() -> new Category(cs.getName(), cs.getDescription()));
                        cat.setDescription(cs.getDescription());
                        Category saved = categoryRepository.save(cat);
                        categoryMap.put(cs.getName().toLowerCase(), saved);
                        restoredCategories++;
                    }
                }
            }

            Map<String, Supplier> supplierMap = new HashMap<>();
            int restoredSuppliers = 0;
            if (snapshot.getSuppliers() != null) {
                for (SupplierSnapshot ss : snapshot.getSuppliers()) {
                    if (ss.getCompanyName() != null && !ss.getCompanyName().isBlank()) {
                        Supplier sup = supplierRepository.findByCompanyNameIgnoreCase(ss.getCompanyName())
                                .orElseGet(Supplier::new);
                        sup.setCompanyName(ss.getCompanyName());
                        sup.setContactPerson(ss.getContactPerson());
                        sup.setEmail(ss.getEmail());
                        sup.setPhone(ss.getPhone());
                        sup.setAddress(ss.getAddress());
                        sup.setBusinessRegistrationNumber(ss.getDrugLicenseNumber());
                        if (ss.getStatus() != null) {
                            try { sup.setStatus(SupplierStatus.valueOf(ss.getStatus())); } catch (Exception ignored) {}
                        }
                        Supplier saved = supplierRepository.save(sup);
                        supplierMap.put(ss.getCompanyName().toLowerCase(), saved);
                        restoredSuppliers++;
                    }
                }
            }

            int restoredMedicines = 0;
            if (snapshot.getMedicines() != null) {
                for (MedicineSnapshot ms : snapshot.getMedicines()) {
                    if (ms.getBatchNumber() != null && !ms.getBatchNumber().isBlank()) {
                        Medicine med = medicineRepository.findByBatchNumber(ms.getBatchNumber())
                                .orElseGet(Medicine::new);
                        med.setName(ms.getName());
                        med.setGenericName(ms.getGenericName());
                        med.setBatchNumber(ms.getBatchNumber());

                        if (ms.getCategoryName() != null && categoryMap.containsKey(ms.getCategoryName().toLowerCase())) {
                            med.setCategory(categoryMap.get(ms.getCategoryName().toLowerCase()));
                        } else if (med.getCategory() == null && !categoryMap.isEmpty()) {
                            med.setCategory(categoryMap.values().iterator().next());
                        }

                        if (ms.getSupplierCompanyName() != null && supplierMap.containsKey(ms.getSupplierCompanyName().toLowerCase())) {
                            med.setSupplier(supplierMap.get(ms.getSupplierCompanyName().toLowerCase()));
                        }

                        med.setQuantity(ms.getQuantity() != null ? ms.getQuantity() : 0);
                        med.setMinimumStockLevel(ms.getMinimumStockLevel() != null ? ms.getMinimumStockLevel() : 10);
                        med.setUnitPrice(ms.getUnitPrice() != null ? ms.getUnitPrice() : BigDecimal.ZERO);
                        med.setDosageForm(ms.getDosageForm());
                        med.setStorageConditions(ms.getStorageConditions());
                        med.setManufacturingDate(ms.getManufacturingDate() != null ? ms.getManufacturingDate() : LocalDate.now().minusMonths(6));
                        med.setExpiryDate(ms.getExpiryDate() != null ? ms.getExpiryDate() : LocalDate.now().plusMonths(12));
                        med.setDescription(ms.getDescription());

                        if (ms.getStatus() != null) {
                            try { med.setStatus(MedicineStatus.valueOf(ms.getStatus())); } catch (Exception ignored) {}
                        }

                        medicineRepository.save(med);
                        restoredMedicines++;
                    }
                }
            }

            // 4. Restore System Settings
            int restoredSettings = 0;
            if (snapshot.getSystemSettings() != null) {
                for (SystemSettingSnapshot sss : snapshot.getSystemSettings()) {
                    if (sss.getSettingKey() != null && !sss.getSettingKey().isBlank()) {
                        SystemSetting setting = systemSettingRepository.findBySettingKey(sss.getSettingKey())
                                .orElseGet(() -> new SystemSetting(sss.getSettingKey(), sss.getSettingValue(), sss.getDescription()));
                        setting.setSettingValue(sss.getSettingValue());
                        setting.setDescription(sss.getDescription());
                        systemSettingRepository.save(setting);
                        restoredSettings++;
                    }
                }
            }

            // 5. Restore Notifications
            int restoredNotifications = 0;
            if (snapshot.getNotifications() != null) {
                for (NotificationSnapshot ns : snapshot.getNotifications()) {
                    if (ns.getTitle() != null && ns.getMessage() != null) {
                        User recipient = ns.getRecipientEmail() != null ? userRepository.findByEmail(ns.getRecipientEmail()).orElse(null) : null;
                        Role role = null;
                        if (ns.getTargetRole() != null) {
                            try { role = Role.valueOf(ns.getTargetRole()); } catch (Exception ignored) {}
                        }
                        NotificationType nType = NotificationType.SYSTEM;
                        if (ns.getType() != null) {
                            try { nType = NotificationType.valueOf(ns.getType()); } catch (Exception ignored) {}
                        }
                        Notification notif = new Notification(recipient, role, ns.getTitle(), ns.getMessage(), nType, ns.getNavigationUrl());
                        if (ns.getIsRead() != null) {
                            notif.setIsRead(ns.getIsRead());
                        }
                        notificationRepository.save(notif);
                        restoredNotifications++;
                    }
                }
            }

            auditLogService.log(adminEmail, "ADMIN", "RESTORE_DATABASE", "BackupRecord", preRestoreSnapshot.getId().toString(),
                    "Database successfully restored from " + sourceDescription + ". Restored: " +
                            restoredCategories + " categories, " + restoredSuppliers + " suppliers, " + restoredMedicines + " medicines, " +
                            restoredSettings + " settings, " + restoredNotifications + " notifications.");

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Database restoration completed successfully. Pre-restore safety snapshot archived as #" +
                    preRestoreSnapshot.getId() + " (" + preRestoreSnapshot.getFileName() + ").");
            response.put("restoredFrom", sourceDescription);
            response.put("preRestoreSnapshotId", preRestoreSnapshot.getId());
            response.put("restoredCategories", restoredCategories);
            response.put("restoredSuppliers", restoredSuppliers);
            response.put("restoredMedicines", restoredMedicines);
            response.put("restoredSettings", restoredSettings);
            response.put("restoredNotifications", restoredNotifications);
            response.put("timestamp", LocalDateTime.now().toString());
            return response;
        } catch (Exception e) {
            logger.error("Failed to restore database backup", e);
            throw new BadRequestException("Restoration failed: " + e.getMessage());
        }
    }

    private String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return "UNKNOWN";
        }
    }
}
