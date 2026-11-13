package com.medistock.backend.service;

import com.medistock.backend.dto.InventoryDtos.*;
import com.medistock.backend.entity.*;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class InventoryService {
    private static final int NEAR_EXPIRY_DAYS = 90;

    private final MedicineRepository medicines;
    private final MedicineBatchRepository batches;
    private final CategoryRepository categories;
    private final SupplierRepository suppliers;
    private final StockLogRepository logs;
    private final UserRepository users;

    public InventoryService(MedicineRepository medicines, MedicineBatchRepository batches, CategoryRepository categories,
                            SupplierRepository suppliers, StockLogRepository logs, UserRepository users) {
        this.medicines = medicines; this.batches = batches; this.categories = categories;
        this.suppliers = suppliers; this.logs = logs; this.users = users;
    }

    /** Search and filters: all optional. stock = In stock / Low stock / Out of stock, expiry = Safe / Near expiry / Expired. */
    @Transactional(readOnly = true)
    public List<InventoryRow> list(String search, Long categoryId, Long supplierId, String stock, String expiry) {
        String q = search == null ? "" : search.trim().toLowerCase();
        return batches.findAll(Sort.by("medicine.name", "expiryDate")).stream()
            .filter(b -> b.getMedicine().isActive())
            .filter(b -> q.isEmpty() || b.getMedicine().getName().toLowerCase().contains(q)
                                     || b.getBatchNumber().toLowerCase().contains(q))
            .filter(b -> categoryId == null || b.getMedicine().getCategory().getId().equals(categoryId))
            .filter(b -> supplierId == null || b.getSupplier().getId().equals(supplierId))
            .map(InventoryService::toRow)
            .filter(r -> blank(stock) || r.stockStatus().equalsIgnoreCase(stock.trim()))
            .filter(r -> blank(expiry) || r.expiryStatus().equalsIgnoreCase(expiry.trim()))
            .toList();
    }

    @Transactional
    public InventoryRow create(InventoryRequest r, String username) {
        if (r.quantity() == null) throw bad("quantity", "Quantity is required");
        checkDates(r);
        Category category = category(r.categoryId());
        Supplier supplier = supplier(r.supplierId());

        String name = r.name().trim();
        Medicine m = medicines.findByNameIgnoreCase(name).orElseGet(() -> {
            Medicine n = new Medicine();
            n.setName(name);
            return n;
        });
        m.setCategory(category);
        m.setReorderLevel(r.reorderLevel());
        m.setActive(true);   // an existing medicine just gets another batch
        medicines.save(m);

        String batchNo = r.batchNumber().trim();
        if (batches.existsByMedicineIdAndBatchNumberIgnoreCase(m.getId(), batchNo))
            throw conflict("batchNumber", "This batch number already exists for this medicine");

        MedicineBatch b = new MedicineBatch();
        b.setMedicine(m);
        fillBatch(b, r, supplier, batchNo);
        b.setQuantity(r.quantity());
        batches.save(b);

        StockLog log = new StockLog();
        log.setBatch(b);
        log.setChangeQuantity(r.quantity());
        log.setQuantityAfter(r.quantity());
        log.setType(StockChangeType.INITIAL);
        log.setNote("Initial stock");
        log.setPerformedBy(users.findByUsernameIgnoreCase(username).orElse(null));
        logs.save(log);
        return toRow(b);
    }

    @Transactional
    public InventoryRow update(Long batchId, InventoryRequest r) {
        MedicineBatch b = batches.findById(batchId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Batch not found"));
        Medicine m = b.getMedicine();
        checkDates(r);
        String name = r.name().trim();
        if (!m.getName().equalsIgnoreCase(name) && medicines.existsByNameIgnoreCase(name))
            throw conflict("name", "A medicine with this name already exists");
        String batchNo = r.batchNumber().trim();
        if (!b.getBatchNumber().equalsIgnoreCase(batchNo)
            && batches.existsByMedicineIdAndBatchNumberIgnoreCase(m.getId(), batchNo))
            throw conflict("batchNumber", "This batch number already exists for this medicine");

        m.setName(name);
        m.setCategory(category(r.categoryId()));
        m.setReorderLevel(r.reorderLevel());
        fillBatch(b, r, supplier(r.supplierId()), batchNo);
        return toRow(b);   // quantity is not changed here
    }

    /** "Delete" hides the medicine and all its batches. History is kept. */
    @Transactional
    public void deleteMedicine(Long medicineId) {
        Medicine m = medicines.findById(medicineId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Medicine not found"));
        m.setActive(false);
    }

    private Category category(Long id) {
        return categories.findById(id).orElseThrow(() -> bad("categoryId", "Category not found"));
    }

    private Supplier supplier(Long id) {
        Supplier s = suppliers.findById(id).orElseThrow(() -> bad("supplierId", "Supplier not found"));
        if (!s.isActive()) throw bad("supplierId", "This supplier is inactive");
        return s;
    }

    private static void fillBatch(MedicineBatch b, InventoryRequest r, Supplier supplier, String batchNo) {
        b.setSupplier(supplier);
        b.setBatchNumber(batchNo);
        b.setManufacturingDate(r.manufacturingDate());
        b.setExpiryDate(r.expiryDate());
        b.setPrice(r.price());
    }

    private static void checkDates(InventoryRequest r) {
        if (r.manufacturingDate().isAfter(LocalDate.now()))
            throw bad("manufacturingDate", "Manufacturing date cannot be in the future");
        if (!r.expiryDate().isAfter(r.manufacturingDate()))
            throw bad("expiryDate", "Expiry date must be after the manufacturing date");
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }
    private static ApiException bad(String field, String msg) { return new ApiException(HttpStatus.BAD_REQUEST, msg, field); }
    private static ApiException conflict(String field, String msg) { return new ApiException(HttpStatus.CONFLICT, msg, field); }

    static InventoryRow toRow(MedicineBatch b) {
        Medicine m = b.getMedicine();
        long days = ChronoUnit.DAYS.between(LocalDate.now(), b.getExpiryDate());
        String stock = b.getQuantity() == 0 ? "Out of stock" : b.getQuantity() <= m.getReorderLevel() ? "Low stock" : "In stock";
        String expiry = days < 0 ? "Expired" : days <= NEAR_EXPIRY_DAYS ? "Near expiry" : "Safe";
        return new InventoryRow(b.getId(), m.getId(), m.getName(), b.getBatchNumber(),
            m.getCategory().getId(), m.getCategory().getName(), b.getSupplier().getId(), b.getSupplier().getName(),
            b.getQuantity(), m.getReorderLevel(), b.getManufacturingDate(), b.getExpiryDate(),
            b.getPrice(), stock, expiry, days);
    }
}
