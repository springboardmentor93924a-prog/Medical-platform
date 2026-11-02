
package com.medistock.service;

import com.medistock.dto.PurchaseOrderRequest;
import com.medistock.dto.ReceivePurchaseOrderRequest;

import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.PurchaseOrderItem;
import com.medistock.entity.Inventory;

import com.medistock.repository.InventoryRepository;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository orderRepository;
    private final PurchaseOrderItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryRepository inventoryRepository;

    // Constructor injection
    public PurchaseOrderService(
            PurchaseOrderRepository orderRepository,
            PurchaseOrderItemRepository itemRepository,
            SupplierRepository supplierRepository,
            MedicineRepository medicineRepository,
            InventoryRepository inventoryRepository) {

        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.supplierRepository = supplierRepository;
        this.medicineRepository = medicineRepository;
        this.inventoryRepository = inventoryRepository;
    }

    // CREATE PURCHASE ORDER
    @Transactional
    public PurchaseOrder createOrder(
            PurchaseOrderRequest request,
            Long userId) {

        if (request.getSupplierId() == null
                || !supplierRepository.existsById(request.getSupplierId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Select a valid supplier");
        }

        List<PurchaseOrderRequest.ItemRequest> requestedItems =
                request.getItems();

        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Add at least one medicine");
        }

        BigDecimal total = BigDecimal.ZERO;

        List<PurchaseOrderItem> itemsToSave = new ArrayList<>();

        for (PurchaseOrderRequest.ItemRequest item : requestedItems) {

            if (item.getMedicineId() == null
                    || !medicineRepository.existsById(item.getMedicineId())) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Select a valid medicine");
            }

            if (item.getQuantity() == null
                    || item.getQuantity() <= 0) {

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
        order.setOrderDate(LocalDate.now());

        PurchaseOrder savedOrder = orderRepository.save(order);

        for (PurchaseOrderItem item : itemsToSave) {

            item.setPurchaseOrderId(
                    savedOrder.getPurchaseOrderId());

            itemRepository.save(item);
        }

        return savedOrder;
    }

    // GET ALL PURCHASE ORDERS
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getAllOrders() {

        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    // GET PURCHASE ORDER BY ID
    @Transactional(readOnly = true)
    public PurchaseOrder getOrder(Long id) {

        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Purchase order not found"));
    }

    // GET ORDERS BY SUPPLIER
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getSupplierOrders(Long supplierId) {

        return orderRepository.findBySupplierId(supplierId);
    }

    // SAVE PURCHASE ORDER
    @Transactional
    public PurchaseOrder saveOrder(PurchaseOrder order) {

        return orderRepository.save(order);
    }

    // GET PURCHASE ORDER ITEMS
    @Transactional(readOnly = true)
    public List<PurchaseOrderItem> getOrderItems(Long orderId) {

        if (!orderRepository.existsById(orderId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Purchase order not found");
        }

        return itemRepository.findByPurchaseOrderId(orderId);
    }

    // RECEIVE PURCHASE ORDER
    @Transactional
    public PurchaseOrder receiveOrder(
            Long orderId,
            ReceivePurchaseOrderRequest request) {

        // Lock purchase order during receiving
        PurchaseOrder order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Purchase order not found"));

        String status = order.getStatus();

        if (!"APPROVED".equals(status)
                && !"PARTIALLY_RECEIVED".equals(status)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only approved or partially received orders can be received");
        }

        if (request == null
                || request.getItems() == null
                || request.getItems().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Add at least one received item");
        }

        List<PurchaseOrderItem> orderItems =
                itemRepository.findByPurchaseOrderId(orderId);

        // Validate receipt lines
        Map<Long, Integer> requestedTotals = new HashMap<>();

        for (ReceivePurchaseOrderRequest.ReceiptItem receipt
                : request.getItems()) {

            if (receipt.getItemId() == null
                    || receipt.getReceivedQuantity() == null
                    || receipt.getReceivedQuantity() <= 0) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Select an item and enter a valid received quantity");
            }

            String batchNumber = receipt.getBatchNumber();

            if (batchNumber == null || batchNumber.isBlank()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Batch number is required");
            }

            LocalDate manufacturingDate =
                    receipt.getManufacturingDate();

            LocalDate expiryDate =
                    receipt.getExpiryDate();

            if (manufacturingDate == null
                    || expiryDate == null
                    || expiryDate.isBefore(manufacturingDate)) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Enter valid manufacturing and expiry dates");
            }

            requestedTotals.merge(
                    receipt.getItemId(),
                    receipt.getReceivedQuantity(),
                    Integer::sum);
        }

        // Check over-receiving
        for (Map.Entry<Long, Integer> entry
                : requestedTotals.entrySet()) {

            PurchaseOrderItem item = orderItems.stream()
                    .filter(i -> i.getItemId().equals(entry.getKey()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Item does not belong to this purchase order"));

            int alreadyReceived = item.getReceivedQuantity() == null
                    ? 0
                    : item.getReceivedQuantity();

            int remaining = item.getQuantity() - alreadyReceived;

            if (entry.getValue() > remaining) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Received quantity exceeds remaining quantity for medicine "
                                + item.getMedicineId());
            }
        }

        // Create inventory batches
        for (ReceivePurchaseOrderRequest.ReceiptItem receipt
                : request.getItems()) {

            PurchaseOrderItem item = orderItems.stream()
                    .filter(i -> i.getItemId().equals(receipt.getItemId()))
                    .findFirst()
                    .orElseThrow();

            Inventory inventory = new Inventory();

            inventory.setMedicineId(item.getMedicineId());
            inventory.setSupplierId(order.getSupplierId());
            inventory.setBatchNumber(receipt.getBatchNumber().trim());
            inventory.setQuantity(receipt.getReceivedQuantity());
            inventory.setMinimumStock(10);
            inventory.setUnitPrice(item.getUnitPrice());

            inventory.setManufacturingDate(
                    receipt.getManufacturingDate());

            inventory.setExpiryDate(
                    receipt.getExpiryDate());

            inventoryRepository.save(inventory);

            // Update received quantity
            int oldReceived = item.getReceivedQuantity() == null
                    ? 0
                    : item.getReceivedQuantity();

            item.setReceivedQuantity(
                    oldReceived + receipt.getReceivedQuantity());
        }

        // Save updated purchase order items
        itemRepository.saveAll(orderItems);

        // Check whether order is fully received
        boolean fullyReceived = orderItems.stream().allMatch(item ->
                item.getReceivedQuantity() != null
                        && item.getReceivedQuantity()
                        .equals(item.getQuantity()));

        order.setStatus(
                fullyReceived
                        ? "RECEIVED"
                        : "PARTIALLY_RECEIVED");

        return orderRepository.save(order);
    }
}
