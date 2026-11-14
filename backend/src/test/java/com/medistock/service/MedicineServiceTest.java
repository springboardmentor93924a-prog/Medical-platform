package com.medistock.service;

import com.medistock.dto.request.MedicineRequest;
import com.medistock.entity.Category;
import com.medistock.entity.Medicine;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.enums.MedicineStatus;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.enums.UserStatus;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.repository.*;
import com.medistock.service.impl.MedicineServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MedicineServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private MedicineServiceImpl medicineService;

    @BeforeEach
    void setUp() {
        medicineService = new MedicineServiceImpl(
                medicineRepository,
                categoryRepository,
                supplierRepository,
                stockMovementRepository,
                userRepository,
                notificationService,
                auditLogService
        );
    }

    @Test
    @DisplayName("Should successfully create medicine with valid dates and batch number")
    void testCreateMedicineSuccess() {
        MedicineRequest request = new MedicineRequest();
        request.setName("Amoxicillin 500mg");
        request.setGenericName("Amoxicillin");
        request.setBatchNumber("AMX-2026-001");
        request.setCategoryId(1L);
        request.setSupplierId(1L);
        request.setQuantity(100);
        request.setMinimumStockLevel(20);
        request.setUnitPrice(new BigDecimal("12.50"));
        request.setManufacturingDate(LocalDate.now().minusMonths(2));
        request.setExpiryDate(LocalDate.now().plusMonths(24));

        Category category = new Category("Antibiotics", "Antibacterial agents");
        category.setId(1L);

        Supplier supplier = new Supplier("PharmaSupply Co", "Agent", "agent@pharmasupply.com", "123", "Addr", "REG123", SupplierStatus.APPROVED);
        supplier.setId(1L);

        User pharmacist = new User("pharm@medistock.com", "pass", "Pharm Name", "123", "Addr", Role.PHARMACIST, UserStatus.ACTIVE);

        when(medicineRepository.existsByBatchNumber("AMX-2026-001")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(userRepository.findByEmail("pharm@medistock.com")).thenReturn(Optional.of(pharmacist));
        when(medicineRepository.save(any(Medicine.class))).thenAnswer(invocation -> {
            Medicine m = invocation.getArgument(0);
            m.setId(10L);
            return m;
        });

        Medicine created = medicineService.createMedicine(request, "pharm@medistock.com");

        assertNotNull(created);
        assertEquals("Amoxicillin 500mg", created.getName());
        assertEquals("AMX-2026-001", created.getBatchNumber());
        assertEquals(100, created.getQuantity());
        verify(stockMovementRepository).save(any());
        verify(auditLogService).log(eq("pharm@medistock.com"), any(), eq("CREATE_MEDICINE"), eq("Medicine"), eq("10"), any());
    }

    @Test
    @DisplayName("Should reject medicine creation if expiry date is earlier than manufacturing date")
    void testRejectExpiryBeforeManufacturingDate() {
        MedicineRequest request = new MedicineRequest();
        request.setName("Test Medicine");
        request.setBatchNumber("BATCH-999");
        request.setCategoryId(1L);
        request.setQuantity(50);
        request.setMinimumStockLevel(10);
        request.setUnitPrice(new BigDecimal("5.00"));
        request.setManufacturingDate(LocalDate.of(2026, 6, 1));
        request.setExpiryDate(LocalDate.of(2026, 1, 1)); // Earlier than mfg!

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                medicineService.createMedicine(request, "pharm@medistock.com")
        );
        assertTrue(ex.getMessage().contains("cannot be earlier than manufacturing date"));
    }

    @Test
    @DisplayName("Should reject duplicate medicine batch number")
    void testRejectDuplicateBatchNumber() {
        MedicineRequest request = new MedicineRequest();
        request.setName("Test Medicine");
        request.setBatchNumber("DUPLICATE-BATCH");
        request.setCategoryId(1L);
        request.setManufacturingDate(LocalDate.now().minusMonths(1));
        request.setExpiryDate(LocalDate.now().plusMonths(12));

        when(medicineRepository.existsByBatchNumber("DUPLICATE-BATCH")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                medicineService.createMedicine(request, "pharm@medistock.com")
        );
    }
}
