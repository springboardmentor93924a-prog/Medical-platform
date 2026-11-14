package com.medistock.service;

import com.medistock.dto.request.OrderStatusUpdateRequest;
import com.medistock.dto.request.PurchaseOrderItemRequest;
import com.medistock.dto.request.PurchaseOrderRequest;
import com.medistock.dto.request.ReceiveStockRequest;
import com.medistock.entity.*;
import com.medistock.enums.*;
import com.medistock.repository.*;
import com.medistock.service.impl.PurchaseOrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PurchaseOrderServiceTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupplierService supplierService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private PurchaseOrderServiceImpl purchaseOrderService;

    @BeforeEach
    void setUp() {
        purchaseOrderService = new PurchaseOrderServiceImpl(
                purchaseOrderRepository,
                supplierRepository,
                medicineRepository,
                stockMovementRepository,
                userRepository,
                supplierService,
                notificationService,
                auditLogService
        );
    }

    @Test
    @DisplayName("Should successfully create purchase order with calculated totals")
    void testCreatePurchaseOrder() {
        PurchaseOrderRequest request = new PurchaseOrderRequest();
        request.setSupplierId(1L);
        request.setExpectedDeliveryDate(LocalDate.now().plusDays(7));
        request.setNotes("Urgent batch delivery");

        PurchaseOrderItemRequest item = new PurchaseOrderItemRequest(10L, 50, new BigDecimal("10.00"));
        request.setItems(List.of(item));

        Supplier supplier = new Supplier("Apex Pharma", "Alice", "alice@apex.com", "123", "Addr", "REG", SupplierStatus.APPROVED);
        supplier.setId(1L);

        Medicine medicine = new Medicine();
        medicine.setId(10L);
        medicine.setName("Paracetamol 500mg");
        medicine.setQuantity(20);

        User pharmacist = new User("pharm@medistock.com", "pass", "Pharm", "123", "Addr", Role.PHARMACIST, UserStatus.ACTIVE);

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(medicineRepository.findById(10L)).thenReturn(Optional.of(medicine));
        when(userRepository.findByEmail("pharm@medistock.com")).thenReturn(Optional.of(pharmacist));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> {
            PurchaseOrder p = invocation.getArgument(0);
            p.setId(100L);
            return p;
        });

        PurchaseOrder created = purchaseOrderService.createOrder(request, "pharm@medistock.com");

        assertNotNull(created);
        assertEquals(new BigDecimal("500.00"), created.getTotalAmount());
        assertEquals(OrderStatus.PENDING, created.getOrderStatus());
        assertEquals(1, created.getItems().size());
        verify(purchaseOrderRepository).save(any());
    }

    @Test
    @DisplayName("Should receive goods and automatically increment medicine stock level in inventory")
    void testReceiveStockIncrementsInventoryQuantity() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(100L);
        po.setPoNumber("PO-20261108-1111");
        po.setOrderStatus(OrderStatus.SHIPPED);

        Supplier supplier = new Supplier("Apex Pharma", "Alice", "alice@apex.com", "123", "Addr", "REG", SupplierStatus.APPROVED);
        po.setSupplier(supplier);

        Medicine medicine = new Medicine();
        medicine.setId(10L);
        medicine.setName("Paracetamol 500mg");
        medicine.setQuantity(20); // Initial quantity

        PurchaseOrderItem item = new PurchaseOrderItem(medicine, 50, new BigDecimal("10.00"));
        item.setId(5L);
        item.setReceivedQuantity(0);
        po.addItem(item);

        ReceiveStockRequest request = new ReceiveStockRequest();
        ReceiveStockRequest.ReceiveItemDto receiveDto = new ReceiveStockRequest.ReceiveItemDto(5L, 50);
        request.setItems(List.of(receiveDto));

        User staffUser = new User("staff@medistock.com", "pass", "Staff Member", "123", "Addr", Role.STAFF, UserStatus.ACTIVE);
        when(purchaseOrderRepository.findById(100L)).thenReturn(Optional.of(po));
        when(userRepository.findByEmail("staff@medistock.com")).thenReturn(Optional.of(staffUser));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        PurchaseOrder updated = purchaseOrderService.receiveOrderStock(100L, request, "staff@medistock.com");

        assertNotNull(updated);
        assertEquals(OrderStatus.COMPLETED, updated.getOrderStatus());
        assertEquals(70, medicine.getQuantity()); // 20 initial + 50 received = 70!
        verify(medicineRepository).save(medicine);
        verify(stockMovementRepository).save(any(StockMovement.class));
    }
}
