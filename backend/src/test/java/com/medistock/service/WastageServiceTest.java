package com.medistock.service;

import com.medistock.dto.request.WastageRequest;
import com.medistock.dto.request.WastageReviewRequest;
import com.medistock.entity.Medicine;
import com.medistock.entity.StockMovement;
import com.medistock.entity.User;
import com.medistock.entity.WastageReport;
import com.medistock.enums.Role;
import com.medistock.enums.UserStatus;
import com.medistock.enums.WastageReason;
import com.medistock.enums.WastageStatus;
import com.medistock.exception.BadRequestException;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.StockMovementRepository;
import com.medistock.repository.UserRepository;
import com.medistock.repository.WastageReportRepository;
import com.medistock.service.impl.WastageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WastageServiceTest {

    @Mock
    private WastageReportRepository wastageReportRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private WastageServiceImpl wastageService;

    @BeforeEach
    void setUp() {
        wastageService = new WastageServiceImpl(
                wastageReportRepository,
                medicineRepository,
                userRepository,
                stockMovementRepository,
                notificationService,
                auditLogService
        );
    }

    @Test
    @DisplayName("Should successfully report wastage in PENDING status")
    void testReportWastage() {
        WastageRequest request = new WastageRequest();
        request.setMedicineId(1L);
        request.setQuantityWasted(5);
        request.setReason(WastageReason.DAMAGED);
        request.setDescription("Broken ampoules during transit");

        Medicine medicine = new Medicine();
        medicine.setId(1L);
        medicine.setName("Morphine Sulfate 10mg");
        medicine.setBatchNumber("BATCH-MORPH-01");
        medicine.setUnitPrice(new BigDecimal("15.50"));
        medicine.setQuantity(20);

        User reporter = new User("staff@medistock.com", "pass", "Hospital Staff", "123", "Ward", Role.STAFF, UserStatus.ACTIVE);

        when(medicineRepository.findById(1L)).thenReturn(Optional.of(medicine));
        when(userRepository.findByEmail("staff@medistock.com")).thenReturn(Optional.of(reporter));
        when(wastageReportRepository.save(any(WastageReport.class))).thenAnswer(i -> {
            WastageReport r = i.getArgument(0);
            r.setId(10L);
            return r;
        });

        WastageReport created = wastageService.reportWastage(request, "staff@medistock.com");

        assertNotNull(created);
        assertEquals(WastageStatus.PENDING, created.getStatus());
        assertEquals(new BigDecimal("77.50"), created.getTotalLoss());
        verify(wastageReportRepository, times(1)).save(any(WastageReport.class));
    }

    @Test
    @DisplayName("Should approve wastage and deduct stock exactly once")
    void testApproveWastageDeductsStock() {
        Medicine medicine = new Medicine();
        medicine.setId(1L);
        medicine.setName("Ceftriaxone 1g");
        medicine.setBatchNumber("BATCH-CEF-01");
        medicine.setQuantity(50);

        User reporter = new User("pharm@medistock.com", "pass", "Pharmacist", "123", "Rx", Role.PHARMACIST, UserStatus.ACTIVE);
        User admin = new User("admin@medistock.com", "pass", "Administrator", "123", "Admin", Role.ADMIN, UserStatus.ACTIVE);

        WastageReport report = new WastageReport();
        report.setId(100L);
        report.setMedicine(medicine);
        report.setBatchNumber("BATCH-CEF-01");
        report.setQuantityWasted(10);
        report.setStatus(WastageStatus.PENDING);
        report.setReportedBy(reporter);

        when(wastageReportRepository.findById(100L)).thenReturn(Optional.of(report));
        when(userRepository.findByEmail("admin@medistock.com")).thenReturn(Optional.of(admin));
        when(wastageReportRepository.save(any(WastageReport.class))).thenAnswer(i -> i.getArgument(0));

        WastageReviewRequest reviewRequest = new WastageReviewRequest();
        reviewRequest.setAction("APPROVE");
        reviewRequest.setReviewNotes("Verified broken box and approved disposal.");

        WastageReport approved = wastageService.reviewWastage(100L, reviewRequest, "admin@medistock.com");

        assertEquals(WastageStatus.APPROVED, approved.getStatus());
        assertEquals(40, medicine.getQuantity()); // 50 - 10 = 40
        verify(medicineRepository, times(1)).save(medicine);
        verify(stockMovementRepository, times(1)).save(any(StockMovement.class));
    }

    @Test
    @DisplayName("Should prevent double deduction if wastage is already approved")
    void testPreventDoubleDeduction() {
        WastageReport report = new WastageReport();
        report.setId(100L);
        report.setStatus(WastageStatus.APPROVED);

        when(wastageReportRepository.findById(100L)).thenReturn(Optional.of(report));

        WastageReviewRequest reviewRequest = new WastageReviewRequest();
        reviewRequest.setAction("APPROVE");

        assertThrows(BadRequestException.class, () -> wastageService.reviewWastage(100L, reviewRequest, "admin@medistock.com"));
    }
}
