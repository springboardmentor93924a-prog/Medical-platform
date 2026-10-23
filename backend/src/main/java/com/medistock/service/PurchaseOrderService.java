
package com.medistock.service;

import com.medistock.dto.PurchaseOrderRequest;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.PurchaseOrderItem;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseOrderItemRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.SupplierRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository orderRepository;
    private final PurchaseOrderItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;

    public PurchaseOrderService(
            PurchaseOrderRepository orderRepository,
            PurchaseOrderItemRepository itemRepository,
            SupplierRepository supplierRepository,
            MedicineRepository medicineRepository) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
    }

    @Transactional
    public PurchaseOrder createOrder(PurchaseOrderRequest request, Long userId) {

        if (request.getSupplierId() == null
                || !supplierRepository.existsById(request.getSupplierId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Select a valid supplier");
        }

        List<PurchaseOrderRequest.ItemRequest> requestedItems =
                request.getItems();

        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Add at least one medicine");
        }

        BigDecimal total = BigDecimal.ZERO;
        List<PurchaseOrderItem> itemsToSave = new ArrayList<>();

        for (PurchaseOrderRequest.ItemRequest item : requestedItems) {

            if (item.getMedicineId() == null
                    || !medicineRepository.existsById(item.getMedicineId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Select a valid medicine");
            }

            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Medicine quantity must be greater than zero");
            }

            if (item.getUnitPrice() == null
                    || item.getUnitPrice().signum() < 0
                    || item.getUnitPrice().scale() > 2) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unit price must be non-negative with at most 2 decimal places");
            }

            BigDecimal lineTotal = item.getUnitPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));

            total = total.add(lineTotal);

            PurchaseOrderItem orderItem = new PurchaseOrderItem();
            orderItem.setMedicineId(item.getMedicineId());
            orderItem.setQuantity(item.getQuantity());
            orderItem.setUnitPrice(item.getUnitPrice());

            itemsToSave.add(orderItem);
        }

        total = total.setScale(2, RoundingMode.UNNECESSARY);

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplierId(request.getSupplierId());
        order.setCreatedBy(userId);
        order.setStatus("PENDING");
        order.setTotalAmount(total);
        order.setOrderDate(java.time.LocalDate.now());

        PurchaseOrder savedOrder = orderRepository.save(order);

        for (PurchaseOrderItem item : itemsToSave) {
            item.setPurchaseOrderId(savedOrder.getPurchaseOrderId());
            itemRepository.save(item);
        }

        return savedOrder;
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    @Transactional(readOnly = true)
    public PurchaseOrder getOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Purchase order not found"));
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> getSupplierOrders(Long supplierId) {
        return orderRepository.findBySupplierId(supplierId);
    }

    @Transactional
    public PurchaseOrder saveOrder(PurchaseOrder order) {
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderItem> getOrderItems(Long orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Purchase order not found");
        }

        return itemRepository.findByPurchaseOrderId(orderId);
    }
}
