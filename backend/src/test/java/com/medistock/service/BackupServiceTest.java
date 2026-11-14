package com.medistock.service;

import com.medistock.entity.*;
import com.medistock.enums.MedicineStatus;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.enums.UserStatus;
import com.medistock.repository.*;
import com.medistock.service.impl.BackupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BackupServiceTest {

    @Mock
    private BackupRecordRepository backupRecordRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private MedicineRepository medicineRepository;
    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private WastageReportRepository wastageReportRepository;
    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private SystemSettingRepository systemSettingRepository;
    @Mock
    private AuditLogService auditLogService;

    @TempDir
    Path tempDir;

    private BackupServiceImpl backupService;

    @BeforeEach
    void setUp() {
        backupService = new BackupServiceImpl(
                backupRecordRepository,
                userRepository,
                categoryRepository,
                supplierRepository,
                medicineRepository,
                purchaseOrderRepository,
                stockMovementRepository,
                wastageReportRepository,
                feedbackRepository,
                notificationRepository,
                systemSettingRepository,
                auditLogService
        );
        ReflectionTestUtils.setField(backupService, "configuredBackupDir", tempDir.toString());
    }

    @Test
    @DisplayName("Should successfully create a backup snapshot and compute checksum")
    void testCreateBackupSuccess() {
        User admin = new User("admin@medistock.com", "pass123", "Admin User", "9876543210", "HQ", Role.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findByEmail("admin@medistock.com")).thenReturn(Optional.of(admin));

        Category cat = new Category("Antibiotics", "Medicines that fight bacterial infections");
        when(categoryRepository.findAll()).thenReturn(List.of(cat));

        Supplier sup = new Supplier("PharmaCorp", "Alice", "alice@pharma.com", "1234567890", "Street 1", "REG-1234", SupplierStatus.APPROVED);
        when(supplierRepository.findAll()).thenReturn(List.of(sup));

        Medicine med = new Medicine();
        med.setName("Amoxicillin 500mg");
        med.setGenericName("Amoxicillin");
        med.setBatchNumber("BATCH-001");
        med.setCategory(cat);
        med.setSupplier(sup);
        med.setQuantity(50);
        med.setMinimumStockLevel(10);
        med.setUnitPrice(BigDecimal.valueOf(15.50));
        med.setDosageForm("Capsule");
        med.setStorageConditions("Room temperature");
        med.setManufacturingDate(LocalDate.now().minusMonths(1));
        med.setExpiryDate(LocalDate.now().plusMonths(12));
        med.setDescription("Standard antibiotic");
        med.setStatus(MedicineStatus.ACTIVE);
        when(medicineRepository.findAll()).thenReturn(List.of(med));

        when(purchaseOrderRepository.findAll()).thenReturn(Collections.emptyList());
        when(stockMovementRepository.findAll()).thenReturn(Collections.emptyList());
        when(wastageReportRepository.findAll()).thenReturn(Collections.emptyList());
        when(feedbackRepository.findAll()).thenReturn(Collections.emptyList());
        when(notificationRepository.findAll()).thenReturn(Collections.emptyList());
        when(systemSettingRepository.findAll()).thenReturn(Collections.emptyList());
        when(userRepository.findAll()).thenReturn(List.of(admin));

        when(backupRecordRepository.save(any(BackupRecord.class))).thenAnswer(invocation -> {
            BackupRecord record = invocation.getArgument(0);
            record.setId(101L);
            record.setCreatedAt(LocalDateTime.now());
            return record;
        });

        BackupRecord result = backupService.createBackup("admin@medistock.com");

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        assertNotNull(result.getChecksumSha256());
        assertTrue(result.getFileSizeBytes() > 0);
        assertTrue(result.getFileName().startsWith("medistock_backup_"));
        verify(auditLogService, times(1)).log(eq("admin@medistock.com"), eq("ADMIN"), eq("CREATE_BACKUP"), eq("BackupRecord"), any(), any());
    }

    @Test
    @DisplayName("Should successfully delete a backup and record audit log")
    void testDeleteBackupSuccess() {
        BackupRecord record = new BackupRecord();
        record.setId(55L);
        record.setFileName("medistock_backup_test.json");
        record.setFilePath(tempDir.resolve("medistock_backup_test.json").toString());
        when(backupRecordRepository.findById(55L)).thenReturn(Optional.of(record));

        backupService.deleteBackup(55L, "admin@medistock.com");

        verify(backupRecordRepository, times(1)).delete(record);
        verify(auditLogService, times(1)).log(eq("admin@medistock.com"), eq("ADMIN"), eq("DELETE_BACKUP"), eq("BackupRecord"), eq("55"), any());
    }
}
