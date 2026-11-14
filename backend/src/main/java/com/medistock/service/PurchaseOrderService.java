package com.medistock.service;

import com.medistock.dto.request.OrderStatusUpdateRequest;
import com.medistock.dto.request.PurchaseOrderRequest;
import com.medistock.dto.request.ReceiveStockRequest;
import com.medistock.entity.PurchaseOrder;
import com.medistock.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PurchaseOrderService {
    PurchaseOrder createOrder(PurchaseOrderRequest request, String userEmail);
    Page<PurchaseOrder> getAllOrders(Long supplierId, OrderStatus status, Pageable pageable);
    PurchaseOrder getOrderById(Long id, String userEmail);
    PurchaseOrder getOrderByPoNumber(String poNumber, String userEmail);
    PurchaseOrder approveOrder(Long id, String userEmail);
    PurchaseOrder rejectOrderByAdmin(Long id, String reason, String userEmail);
    PurchaseOrder acceptOrderBySupplier(Long id, String notes, String supplierEmail);
    PurchaseOrder rejectOrderBySupplier(Long id, String reason, String supplierEmail);
    PurchaseOrder updateOrderStatusBySupplier(Long id, OrderStatusUpdateRequest request, String supplierEmail);
    PurchaseOrder receiveOrderStock(Long id, ReceiveStockRequest request, String userEmail);
    PurchaseOrder cancelOrder(Long id, String userEmail);
}
