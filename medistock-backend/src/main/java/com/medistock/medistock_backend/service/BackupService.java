package com.medistock.medistock_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.medistock.medistock_backend.dto.BackupMetadata;
import com.medistock.medistock_backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BackupService {

    // Inject all repositories
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockLogRepository stockLogRepository;
    private final StaffTaskRepository staffTaskRepository;
    private final FeedbackRepository feedbackRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationStateRepository notificationStateRepository;

    @Value("${app.backup.directory:./backups}")
    private String backupDir;

    @Value("${app.backup.max-backups:10}")
    private int maxBackups;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(SerializationFeature.INDENT_OUTPUT);

    // ==========================================
    // CREATE BACKUP
    // ==========================================
    public BackupMetadata createBackup() throws Exception {
        Path dir = Paths.get(backupDir);
        if (!Files.exists(dir)) Files.createDirectories(dir);

        // Build the backup payload — every table
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("users", userRepository.findAll());
        data.put("roles", roleRepository.findAll());
        data.put("medicines", medicineRepository.findAll());
        data.put("suppliers", supplierRepository.findAll());
        data.put("purchaseOrders", purchaseOrderRepository.findAll());
        data.put("stockLogs", stockLogRepository.findAll());
        data.put("staffTasks", staffTaskRepository.findAll());
        data.put("feedback", feedbackRepository.findAll());
        data.put("auditLogs", auditLogRepository.findAll());
        data.put("notificationStates", notificationStateRepository.findAll());

        // Wrapper with metadata
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("version", "1.0");
        payload.put("createdAt", LocalDateTime.now().toString());
        payload.put("tableCount", data.size());
        payload.put("data", data);

        // Write file
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String fileName = "backup_" + timestamp + ".json";
        Path filePath = dir.resolve(fileName);

        mapper.writeValue(filePath.toFile(), payload);

        // Auto-cleanup old backups
        cleanupOldBackups();

        File f = filePath.toFile();
        return new BackupMetadata(
                fileName,
                f.length(),
                LocalDateTime.now(),
                "OK",
                data.size()
        );
    }

    // ==========================================
    // LIST BACKUPS
    // ==========================================
    public List<BackupMetadata> listBackups() throws Exception {
        Path dir = Paths.get(backupDir);
        if (!Files.exists(dir)) return Collections.emptyList();

        List<BackupMetadata> list = new ArrayList<>();
        File[] files = dir.toFile().listFiles((d, name) -> name.startsWith("backup_") && name.endsWith(".json"));

        if (files == null) return Collections.emptyList();

        for (File f : files) {
            BackupMetadata meta = new BackupMetadata();
            meta.setFileName(f.getName());
            meta.setSizeBytes(f.length());
            meta.setStatus(f.length() > 100 ? "OK" : "EMPTY");

            // Extract timestamp from filename
            try {
                String ts = f.getName().replace("backup_", "").replace(".json", "");
                LocalDateTime created = LocalDateTime.parse(
                        ts.replace("_", " ").replace("-", ":").substring(0, 19).replaceFirst(":", "-").replaceFirst(":", "-"),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                );
                meta.setCreatedAt(created);
            } catch (Exception e) {
                meta.setCreatedAt(LocalDateTime.now());
            }

            // Peek table count
            try {
                Map<String, Object> content = mapper.readValue(f, Map.class);
                Object tc = content.get("tableCount");
                meta.setTableCount(tc instanceof Integer ? (Integer) tc : 0);
            } catch (Exception e) {
                meta.setTableCount(0);
            }

            list.add(meta);
        }

        list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return list;
    }

    // ==========================================
    // RESTORE BACKUP
    // ==========================================
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> restoreBackup(String fileName) throws Exception {
        Path dir = Paths.get(backupDir);
        Path filePath = dir.resolve(fileName);

        if (!Files.exists(filePath)) {
            throw new RuntimeException("Backup file not found: " + fileName);
        }

        Map<String, Object> payload = mapper.readValue(filePath.toFile(), Map.class);
        Map<String, Object> data = (Map<String, Object>) payload.get("data");

        if (data == null) throw new RuntimeException("Invalid backup format — no 'data' field");

        // We restore in dependency order (parents first)
        Map<String, Integer> restoredCounts = new LinkedHashMap<>();

        try {
            // 1. Roles (no dependencies)
            if (data.get("roles") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("roles");
                roleRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.Role r = mapper.convertValue(row, com.medistock.medistock_backend.entity.Role.class);
                    roleRepository.save(r);
                }
                restoredCounts.put("roles", rows.size());
            }

            // 2. Users (depends on roles)
            if (data.get("users") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("users");
                userRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.User u = mapper.convertValue(row, com.medistock.medistock_backend.entity.User.class);
                    userRepository.save(u);
                }
                restoredCounts.put("users", rows.size());
            }

            // 3. Suppliers
            if (data.get("suppliers") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("suppliers");
                supplierRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.Supplier s = mapper.convertValue(row, com.medistock.medistock_backend.entity.Supplier.class);
                    supplierRepository.save(s);
                }
                restoredCounts.put("suppliers", rows.size());
            }

            // 4. Medicines
            if (data.get("medicines") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("medicines");
                medicineRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.Medicine m = mapper.convertValue(row, com.medistock.medistock_backend.entity.Medicine.class);
                    medicineRepository.save(m);
                }
                restoredCounts.put("medicines", rows.size());
            }

            // 5. Purchase Orders (depends on suppliers + items)
            if (data.get("purchaseOrders") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("purchaseOrders");
                purchaseOrderRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.PurchaseOrder po = mapper.convertValue(row, com.medistock.medistock_backend.entity.PurchaseOrder.class);
                    purchaseOrderRepository.save(po);
                }
                restoredCounts.put("purchaseOrders", rows.size());
            }

            // 6. Stock logs
            if (data.get("stockLogs") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("stockLogs");
                stockLogRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.StockLog l = mapper.convertValue(row, com.medistock.medistock_backend.entity.StockLog.class);
                    stockLogRepository.save(l);
                }
                restoredCounts.put("stockLogs", rows.size());
            }

            // 7. Staff tasks
            if (data.get("staffTasks") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("staffTasks");
                staffTaskRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.StaffTask t = mapper.convertValue(row, com.medistock.medistock_backend.entity.StaffTask.class);
                    staffTaskRepository.save(t);
                }
                restoredCounts.put("staffTasks", rows.size());
            }

            // 8. Feedback
            if (data.get("feedback") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("feedback");
                feedbackRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.Feedback fb = mapper.convertValue(row, com.medistock.medistock_backend.entity.Feedback.class);
                    feedbackRepository.save(fb);
                }
                restoredCounts.put("feedback", rows.size());
            }

            // 9. Audit logs
            if (data.get("auditLogs") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("auditLogs");
                auditLogRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.AuditLog a = mapper.convertValue(row, com.medistock.medistock_backend.entity.AuditLog.class);
                    auditLogRepository.save(a);
                }
                restoredCounts.put("auditLogs", rows.size());
            }

            // 10. Notification states
            if (data.get("notificationStates") != null) {
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.get("notificationStates");
                notificationStateRepository.deleteAll();
                for (Map<String, Object> row : rows) {
                    com.medistock.medistock_backend.entity.NotificationState n = mapper.convertValue(row, com.medistock.medistock_backend.entity.NotificationState.class);
                    notificationStateRepository.save(n);
                }
                restoredCounts.put("notificationStates", rows.size());
            }

            return Map.of(
                    "message", "Backup restored successfully",
                    "fileName", fileName,
                    "restoredTables", restoredCounts
            );

        } catch (Exception e) {
            throw new RuntimeException("Restore failed: " + e.getMessage(), e);
        }
    }

    // ==========================================
    // DELETE BACKUP
    // ==========================================
    public void deleteBackup(String fileName) throws Exception {
        Path filePath = Paths.get(backupDir).resolve(fileName);
        if (!Files.exists(filePath)) {
            throw new RuntimeException("Backup file not found: " + fileName);
        }
        Files.delete(filePath);
    }

    // ==========================================
    // DOWNLOAD BACKUP FILE
    // ==========================================
    public File getBackupFile(String fileName) throws Exception {
        Path filePath = Paths.get(backupDir).resolve(fileName);
        if (!Files.exists(filePath)) {
            throw new RuntimeException("Backup file not found: " + fileName);
        }
        return filePath.toFile();
    }

    // ==========================================
    // AUTO-CLEANUP (keep max-backups recent files)
    // ==========================================
    private void cleanupOldBackups() throws Exception {
        File[] files = Paths.get(backupDir).toFile()
                .listFiles((d, name) -> name.startsWith("backup_") && name.endsWith(".json"));
        if (files == null || files.length <= maxBackups) return;

        List<File> sorted = Arrays.stream(files)
                .sorted(Comparator.comparingLong(File::lastModified))
                .collect(Collectors.toList());

        int toDelete = sorted.size() - maxBackups;
        for (int i = 0; i < toDelete; i++) {
            Files.deleteIfExists(sorted.get(i).toPath());
        }
    }
}