package com.medistock.medistock.service;

import com.medistock.medistock.dto.PosMedicineDto;
import com.medistock.medistock.dto.SaleDto;
import com.medistock.medistock.dto.SaleRequestDto;
import com.medistock.medistock.entity.*;
import com.medistock.medistock.repository.MedicineBatchRepository;
import com.medistock.medistock.repository.SaleRepository;
import com.medistock.medistock.repository.StockLogRepository;
import com.medistock.medistock.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PosService {

    private static final List<String> PAYMENT_METHODS = List.of("CASH", "CARD", "UPI");

    private final MedicineBatchRepository batchRepository;
    private final SaleRepository saleRepository;
    private final StockLogRepository stockLogRepository;
    private final UserRepository userRepository;

    public PosService(
            MedicineBatchRepository batchRepository,
            SaleRepository saleRepository,
            StockLogRepository stockLogRepository,
            UserRepository userRepository) {
        this.batchRepository = batchRepository;
        this.saleRepository = saleRepository;
        this.stockLogRepository = stockLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PosMedicineDto> searchMedicines(String search) {
        String query = search == null ? "" : search.trim().toLowerCase();

        Map<Integer, PosMedicineDto> available = new LinkedHashMap<>();
        for (MedicineBatch batch : batchRepository.findAllSellableBatches(LocalDate.now())) {
            Medicine medicine = batch.getMedicine();
            boolean matches = query.isEmpty()
                    || medicine.getMedicineName().toLowerCase().contains(query)
                    || (medicine.getGenericName() != null && medicine.getGenericName().toLowerCase().contains(query))
                    || String.valueOf(medicine.getMedicineId()).contains(query);
            if (!matches) {
                continue;
            }
            PosMedicineDto existing = available.get(medicine.getMedicineId());
            int quantity = batch.getQuantity() == null ? 0 : batch.getQuantity();
            if (existing == null) {
                available.put(medicine.getMedicineId(), new PosMedicineDto(
                        medicine.getMedicineId(),
                        medicine.getMedicineName(),
                        medicine.getGenericName(),
                        medicine.getDosage(),
                        quantity,
                        safePrice(batch.getSellingPrice())));
            } else {
                available.put(medicine.getMedicineId(), new PosMedicineDto(
                        existing.medicineId(), existing.medicineName(), existing.genericName(), existing.dosage(),
                        existing.availableQuantity() + quantity, existing.sellingPrice()));
            }
        }
        return available.values().stream().limit(15).toList();
    }

    @Transactional
    public SaleDto createSale(SaleRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sale details are required.");
        }
        String customerName = normalize(request.customerName());
        String customerPhone = normalize(request.customerPhone());
        if (customerName == null || customerName.length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A customer name of at most 150 characters is required.");
        }
        if (customerPhone == null || customerPhone.length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A customer phone number of at most 30 characters is required.");
        }
        String paymentMethod = request.paymentMethod() == null ? "" : request.paymentMethod().trim().toUpperCase();
        if (!PAYMENT_METHODS.contains(paymentMethod)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select Cash Payment, Debit / Credit Card, or UPI Digital Payment.");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one medicine to the invoice.");
        }

        Map<Integer, Integer> requestedQuantities = new LinkedHashMap<>();
        for (SaleRequestDto.SaleItemRequestDto item : request.items()) {
            if (item == null || item.medicineId() == null || item.quantity() == null || item.quantity() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every sale item requires a medicine and a positive quantity.");
            }
            requestedQuantities.merge(item.medicineId(), item.quantity(), Math::addExact);
        }

        User cashier = userRepository.findByEmail("admin@medistock.com")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "Unable to record sale: the admin user is missing."));

        Sale sale = new Sale();
        sale.setInvoiceNumber("PENDING-" + System.nanoTime());
        sale.setUser(cashier);
        sale.setSaleDate(LocalDateTime.now());
        sale.setCustomerName(customerName);
        sale.setCustomerPhone(customerPhone);
        sale.setPaymentMethod(paymentMethod);
        sale.setPaymentStatus("PAID");
        sale.setTotalAmount(BigDecimal.ZERO);
        sale.setDiscountAmount(BigDecimal.ZERO);

        BigDecimal subtotal = BigDecimal.ZERO;
        List<StockLog> stockLogs = new ArrayList<>();
        for (Map.Entry<Integer, Integer> requested : requestedQuantities.entrySet()) {
            int remaining = requested.getValue();
            List<MedicineBatch> batches = batchRepository.findSellableBatchesForUpdate(
                    requested.getKey(), LocalDate.now());
            if (batches.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "One of the selected medicines is out of stock.");
            }
            String medicineName = batches.getFirst().getMedicine().getMedicineName();
            int available = batches.stream().mapToInt(batch -> batch.getQuantity() == null ? 0 : batch.getQuantity()).sum();
            if (available < remaining) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, medicineName + " has only " + available + " sellable units available.");
            }

            for (MedicineBatch batch : batches) {
                if (remaining == 0) {
                    break;
                }
                int batchQuantity = batch.getQuantity() == null ? 0 : batch.getQuantity();
                int soldQuantity = Math.min(batchQuantity, remaining);
                BigDecimal unitPrice = safePrice(batch.getSellingPrice());
                if (unitPrice.signum() <= 0) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, medicineName + " has no valid selling price in batch " + batch.getBatchNumber() + ".");
                }

                batch.setQuantity(batchQuantity - soldQuantity);
                SaleItem saleItem = new SaleItem();
                saleItem.setSale(sale);
                saleItem.setBatch(batch);
                saleItem.setQuantity(soldQuantity);
                saleItem.setUnitPrice(unitPrice);
                saleItem.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(soldQuantity))
                        .setScale(2, RoundingMode.HALF_UP));
                sale.getItems().add(saleItem);
                subtotal = subtotal.add(saleItem.getLineTotal());

                StockLog stockLog = new StockLog();
                stockLog.setBatch(batch);
                stockLog.setUser(cashier);
                stockLog.setChangeType("STOCK_OUT");
                stockLog.setQuantityChanged(soldQuantity);
                stockLog.setDateTime(LocalDateTime.now());
                stockLog.setRemarks("Point-of-sale invoice.");
                stockLogs.add(stockLog);
                remaining -= soldQuantity;
            }
        }

        BigDecimal discount = request.discountAmount() == null
                ? BigDecimal.ZERO : request.discountAmount().setScale(2, RoundingMode.HALF_UP);
        if (discount.signum() < 0 || discount.compareTo(subtotal) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Discount must be between zero and the invoice subtotal.");
        }

        sale.setDiscountAmount(discount);
        sale.setTotalAmount(subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP));
        Sale saved = saleRepository.saveAndFlush(sale);
        saved.setInvoiceNumber("MS-" + saved.getSaleDate().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%06d", saved.getSaleId()));
        Sale persisted = saleRepository.save(saved);
        stockLogRepository.saveAll(stockLogs);
        return toDto(persisted, subtotal);
    }

    @Transactional(readOnly = true)
    public SaleDto getSale(Integer id) {
        Sale sale = saleRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale invoice not found."));
        return toDto(sale, subtotal(sale));
    }

    @Transactional(readOnly = true)
    public List<SaleDto> getSales() {
        return saleRepository.findAllWithItems().stream()
                .map(sale -> toDto(sale, subtotal(sale)))
                .toList();
    }

    private SaleDto toDto(Sale sale, BigDecimal subtotal) {
        List<SaleDto.SaleItemDto> items = sale.getItems().stream()
                .map(item -> new SaleDto.SaleItemDto(
                        item.getBatch().getMedicine().getMedicineId(),
                        item.getBatch().getMedicine().getMedicineName(),
                        item.getBatch().getBatchNumber(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()))
                .toList();
        return new SaleDto(
                sale.getSaleId(),
                sale.getInvoiceNumber(),
                sale.getSaleDate(),
                sale.getCustomerName(),
                sale.getCustomerPhone(),
                sale.getPaymentMethod(),
                sale.getPaymentStatus(),
                subtotal,
                sale.getDiscountAmount(),
                sale.getTotalAmount(),
                sale.getUser() == null ? "MediStock Admin" : sale.getUser().getName(),
                items);
    }

    private BigDecimal subtotal(Sale sale) {
        return sale.getItems().stream()
                .map(SaleItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal safePrice(BigDecimal price) {
        return price == null ? BigDecimal.ZERO : price.setScale(2, RoundingMode.HALF_UP);
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
