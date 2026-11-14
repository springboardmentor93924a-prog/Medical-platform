package com.medistock.service;

import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.enums.UserStatus;
import com.medistock.exception.ForbiddenException;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.impl.SupplierServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private SupplierServiceImpl supplierService;

    @BeforeEach
    void setUp() {
        supplierService = new SupplierServiceImpl(
                supplierRepository,
                userRepository,
                medicineRepository,
                purchaseOrderRepository,
                notificationService,
                auditLogService
        );
    }

    @Test
    @DisplayName("Should permit supplier to access their own records")
    void testVerifySupplierAccessAllowsSelf() {
        User user = new User("mysupplier@medistock.com", "pass", "My Supplier", "123", "Addr", Role.SUPPLIER, UserStatus.ACTIVE);
        user.setId(5L);

        Supplier supplier = new Supplier("My Supply Co", "Agent", "mysupplier@medistock.com", "123", "Addr", "REG", SupplierStatus.APPROVED);
        supplier.setId(50L);
        supplier.setUser(user);

        when(userRepository.findByEmail("mysupplier@medistock.com")).thenReturn(Optional.of(user));
        when(supplierRepository.findByUserId(5L)).thenReturn(Optional.of(supplier));

        assertDoesNotThrow(() -> supplierService.verifySupplierAccess("mysupplier@medistock.com", 50L));
    }

    @Test
    @DisplayName("Should strictly reject supplier trying to access another supplier's data")
    void testVerifySupplierAccessRejectsDifferentSupplier() {
        User user = new User("supplierA@medistock.com", "pass", "Supplier A", "123", "Addr", Role.SUPPLIER, UserStatus.ACTIVE);
        user.setId(1L);

        Supplier supplierA = new Supplier("Supplier A Co", "Agent A", "supplierA@medistock.com", "123", "Addr", "REG", SupplierStatus.APPROVED);
        supplierA.setId(10L); // Supplier ID is 10
        supplierA.setUser(user);

        when(userRepository.findByEmail("supplierA@medistock.com")).thenReturn(Optional.of(user));
        when(supplierRepository.findByUserId(1L)).thenReturn(Optional.of(supplierA));

        // Attempting to access Supplier ID 20 (different supplier)
        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                supplierService.verifySupplierAccess("supplierA@medistock.com", 20L)
        );
        assertTrue(ex.getMessage().contains("You are not authorized to view or manage records belonging to another supplier"));
    }

    @Test
    @DisplayName("Should allow Admin and Pharmacist to access supplier data for operations")
    void testAdminAndPharmacistCanAccessAnySupplier() {
        User admin = new User("admin@medistock.com", "pass", "Admin", "123", "Addr", Role.ADMIN, UserStatus.ACTIVE);
        when(userRepository.findByEmail("admin@medistock.com")).thenReturn(Optional.of(admin));

        assertDoesNotThrow(() -> supplierService.verifySupplierAccess("admin@medistock.com", 99L));
    }
}
