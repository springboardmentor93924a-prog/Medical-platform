package com.medistock.service.impl;

import com.medistock.dto.request.MedicineRequest;
import com.medistock.entity.Category;
import com.medistock.entity.Medicine;
import com.medistock.entity.StockMovement;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.enums.MedicineStatus;
import com.medistock.enums.MovementType;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.exception.BadRequestException;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.CategoryRepository;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.StockMovementRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.MedicineService;
import com.medistock.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Value("${app.inventory.expiry-warning-days:60}")
    private int expiryWarningDays;

    public MedicineServiceImpl(MedicineRepository medicineRepository,
                               CategoryRepository categoryRepository,
                               SupplierRepository supplierRepository,
                               StockMovementRepository stockMovementRepository,
                               UserRepository userRepository,
                               NotificationService notificationService,
                               AuditLogService auditLogService) {
        this.medicineRepository = medicineRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    private void validateDates(LocalDate mfgDate, LocalDate expDate) {
        if (expDate.isBefore(mfgDate)) {
            throw new BadRequestException("Expiry date (" + expDate + ") cannot be earlier than manufacturing date (" + mfgDate + ").");
        }
    }

    @Override
    public Page<Medicine> searchMedicines(String query, Long categoryId, Long supplierId, MedicineStatus status, Pageable pageable) {
        MedicineStatus filterStatus = status != null ? status : MedicineStatus.ACTIVE;
        String searchQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return medicineRepository.searchMedicines(searchQuery, categoryId, supplierId, filterStatus, pageable);
    }

    @Override
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    @Override
    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
    }

    @Override
    @Transactional
    public Medicine createMedicine(MedicineRequest request, String userEmail) {
        validateDates(request.getManufacturingDate(), request.getExpiryDate());

        if (medicineRepository.existsByBatchNumber(request.getBatchNumber().trim())) {
            throw new DuplicateResourceException("A medicine batch with batch number '" + request.getBatchNumber() + "' already exists.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));
        }

        Medicine medicine = new Medicine();
        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName());
        medicine.setBatchNumber(request.getBatchNumber().trim());
        medicine.setCategory(category);
        medicine.setSupplier(supplier);
        medicine.setQuantity(request.getQuantity());
        medicine.setMinimumStockLevel(request.getMinimumStockLevel());
        medicine.setUnitPrice(request.getUnitPrice());
        medicine.setDosageForm(request.getDosageForm());
        medicine.setStorageConditions(request.getStorageConditions());
        medicine.setManufacturingDate(request.getManufacturingDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setDescription(request.getDescription());
        medicine.setStatus(MedicineStatus.ACTIVE);

        Medicine saved = medicineRepository.save(medicine);

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (request.getQuantity() > 0) {
            StockMovement movement = new StockMovement(
                    saved,
                    MovementType.STOCK_IN,
                    request.getQuantity(),
                    "Initial stock entry on registration",
                    saved.getBatchNumber(),
                    user
            );
            stockMovementRepository.save(movement);
        }

        // Check for immediate low stock alert
        if (saved.getQuantity() <= saved.getMinimumStockLevel()) {
            NotificationType nType = saved.getQuantity() == 0 ? NotificationType.OUT_OF_STOCK : NotificationType.LOW_STOCK;
            notificationService.sendNotification(
                    null,
                    Role.PHARMACIST,
                    "Stock Alert: " + saved.getName(),
                    "Medicine '" + saved.getName() + "' (Batch: " + saved.getBatchNumber() + ") is at " + saved.getQuantity() + " units (Min: " + saved.getMinimumStockLevel() + ").",
                    nType
            );
        }

        auditLogService.log(userEmail, user != null ? user.getRole().name() : "PHARMACIST", "CREATE_MEDICINE", "Medicine", saved.getId().toString(),
                "Registered medicine " + saved.getName() + " with batch " + saved.getBatchNumber());

        return saved;
    }

    @Override
    @Transactional
    public Medicine updateMedicine(Long id, MedicineRequest request, String userEmail) {
        validateDates(request.getManufacturingDate(), request.getExpiryDate());

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        if (!medicine.getBatchNumber().equalsIgnoreCase(request.getBatchNumber().trim()) &&
                medicineRepository.existsByBatchNumberAndIdNot(request.getBatchNumber().trim(), id)) {
            throw new DuplicateResourceException("A medicine batch with batch number '" + request.getBatchNumber() + "' already exists.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));
        }

        int previousQuantity = medicine.getQuantity();
        int newQuantity = request.getQuantity();

        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName());
        medicine.setBatchNumber(request.getBatchNumber().trim());
        medicine.setCategory(category);
        medicine.setSupplier(supplier);
        medicine.setQuantity(newQuantity);
        medicine.setMinimumStockLevel(request.getMinimumStockLevel());
        medicine.setUnitPrice(request.getUnitPrice());
        medicine.setDosageForm(request.getDosageForm());
        medicine.setStorageConditions(request.getStorageConditions());
        medicine.setManufacturingDate(request.getManufacturingDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setDescription(request.getDescription());

        Medicine updated = medicineRepository.save(medicine);

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (previousQuantity != newQuantity) {
            int delta = newQuantity - previousQuantity;
            MovementType mType = delta > 0 ? MovementType.STOCK_IN : MovementType.ADJUSTMENT;
            StockMovement movement = new StockMovement(
                    updated,
                    mType,
                    Math.abs(delta),
                    "Manual stock adjustment during medicine update (from " + previousQuantity + " to " + newQuantity + ")",
                    updated.getBatchNumber(),
                    user
            );
            stockMovementRepository.save(movement);
        }

        auditLogService.log(userEmail, user != null ? user.getRole().name() : "PHARMACIST", "UPDATE_MEDICINE", "Medicine", id.toString(),
                "Updated medicine details for " + updated.getName());

        return updated;
    }

    @Override
    @Transactional
    public void deleteMedicine(Long id, String userEmail) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        medicine.setStatus(MedicineStatus.ARCHIVED);
        medicineRepository.save(medicine);

        auditLogService.log(userEmail, "PHARMACIST", "ARCHIVE_MEDICINE", "Medicine", id.toString(),
                "Archived medicine " + medicine.getName() + " (Batch: " + medicine.getBatchNumber() + ")");
    }

    @Override
    public List<Medicine> getLowStockMedicines() {
        return medicineRepository.findLowStockMedicines();
    }

    @Override
    public List<Medicine> getOutOfStockMedicines() {
        return medicineRepository.findOutOfStockMedicines();
    }

    @Override
    public List<Medicine> getNearExpiryMedicines() {
        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(expiryWarningDays);
        return medicineRepository.findNearExpiryMedicines(today, warningDate);
    }

    @Override
    public List<Medicine> getExpiredMedicines() {
        return medicineRepository.findExpiredMedicines(LocalDate.now());
    }

    @Override
    @Transactional
    public void scanAndGenerateAlerts() {
        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(expiryWarningDays);

        List<Medicine> expired = medicineRepository.findExpiredMedicines(today);
        for (Medicine m : expired) {
            notificationService.notifyRole(
                    Role.PHARMACIST,
                    "Expired Medicine Alert: " + m.getName(),
                    "Batch " + m.getBatchNumber() + " of medicine '" + m.getName() + "' expired on " + m.getExpiryDate() + ". Do not issue or sell.",
                    NotificationType.EXPIRED
            );
        }

        List<Medicine> nearExpiry = medicineRepository.findNearExpiryMedicines(today, warningDate);
        for (Medicine m : nearExpiry) {
            notificationService.notifyRole(
                    Role.PHARMACIST,
                    "Near Expiry Warning: " + m.getName(),
                    "Medicine '" + m.getName() + "' (Batch: " + m.getBatchNumber() + ") will expire on " + m.getExpiryDate() + ".",
                    NotificationType.EXPIRING_SOON
            );
        }

        List<Medicine> lowStock = medicineRepository.findLowStockMedicines();
        for (Medicine m : lowStock) {
            notificationService.notifyRole(
                    Role.PHARMACIST,
                    "Low Stock Alert: " + m.getName(),
                    "Medicine '" + m.getName() + "' stock is low: " + m.getQuantity() + " remaining (Minimum threshold: " + m.getMinimumStockLevel() + ").",
                    NotificationType.LOW_STOCK
            );
        }
    }
}
