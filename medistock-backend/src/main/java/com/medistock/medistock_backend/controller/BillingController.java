package com.medistock.medistock_backend.controller;

import com.medistock.medistock_backend.dto.SaleRequest;
import com.medistock.medistock_backend.entity.Medicine;
import com.medistock.medistock_backend.entity.Sale;
import com.medistock.medistock_backend.entity.SaleItem;
import com.medistock.medistock_backend.repository.MedicineRepository;
import com.medistock.medistock_backend.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'PHARMACIST', 'ROLE_PHARMACIST', 'STAFF', 'ROLE_STAFF')")
public class BillingController {

    private final SaleRepository saleRepo;
    private final MedicineRepository medicineRepo;

    @PostMapping("/checkout")
    public ResponseEntity<?> processSale(@RequestBody SaleRequest request) {
        try {
            Sale sale = new Sale();
            sale.setInvoiceNumber("INV-" + (1000 + new Random().nextInt(9000)));
            sale.setCustomerName(request.getCustomerName());
            sale.setCustomerPhone(request.getCustomerPhone());
            sale.setPaymentMethod(request.getPaymentMethod());
            sale.setDiscountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : 0.0);

            List<SaleItem> saleItems = new ArrayList<>();
            double subTotal = 0.0;

            for (SaleRequest.CartItem cartItem : request.getItems()) {
                Medicine med = medicineRepo.findById(cartItem.getMedicineId())
                        .orElseThrow(() -> new RuntimeException("Medicine not found: " + cartItem.getMedicineId()));

                if (med.getQuantity() < cartItem.getQuantity()) {
                    return ResponseEntity.badRequest().body("Insufficient stock for " + med.getName());
                }

                // Deduct Stock
                med.setQuantity(med.getQuantity() - cartItem.getQuantity());
                medicineRepo.save(med);

                // Create Sale Item
                SaleItem item = new SaleItem();
                item.setSale(sale);
                item.setMedicine(med);
                item.setQuantity(cartItem.getQuantity());
                item.setUnitPrice(med.getUnitPrice());

                double itemTotal = cartItem.getQuantity() * med.getUnitPrice();
                item.setTotalPrice(itemTotal);
                subTotal += itemTotal;

                saleItems.add(item);
            }

            sale.setSubTotal(subTotal);
            sale.setGrandTotal(subTotal - sale.getDiscountAmount());
            sale.setItems(saleItems);

            saleRepo.save(sale);

            // Return a simple Map to avoid infinite JSON loops
            return ResponseEntity.ok(java.util.Map.of("message", "Sale processed successfully", "invoice", sale.getInvoiceNumber()));

        } catch (Exception e) {
            e.printStackTrace(); // Print the exact error in IntelliJ
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // --- NEW: Get Sales History ---
    @GetMapping("/sales")
    public ResponseEntity<?> getAllSales() {
        try {
            List<Sale> sales = saleRepo.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "saleDate"));

            // Manually map to avoid infinite loops (Sale -> Items -> Sale)
            List<java.util.Map<String, Object>> response = sales.stream().map(s -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", s.getId());
                map.put("invoiceNumber", s.getInvoiceNumber());
                map.put("customerName", s.getCustomerName());
                map.put("customerPhone", s.getCustomerPhone());
                map.put("paymentMethod", s.getPaymentMethod());
                map.put("grandTotal", s.getGrandTotal());
                map.put("discountAmount", s.getDiscountAmount());
                map.put("saleDate", s.getSaleDate());
                return map;
            }).collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }
}