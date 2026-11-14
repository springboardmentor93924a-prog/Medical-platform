package com.medistock.service.impl;

import com.medistock.dto.request.SupplierRequest;
import com.medistock.dto.request.SupplierStatusUpdateRequest;
import com.medistock.dto.request.UpdateProfileRequest;
import com.medistock.entity.Medicine;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.Supplier;
import com.medistock.entity.User;
import com.medistock.enums.NotificationType;
import com.medistock.enums.Role;
import com.medistock.enums.SupplierStatus;
import com.medistock.enums.UserStatus;
import com.medistock.exception.DuplicateResourceException;
import com.medistock.exception.ForbiddenException;
import com.medistock.exception.ResourceNotFoundException;
import com.medistock.repository.MedicineRepository;
import com.medistock.repository.PurchaseOrderRepository;
import com.medistock.repository.SupplierRepository;
import com.medistock.repository.UserRepository;
import com.medistock.service.AuditLogService;
import com.medistock.service.NotificationService;
import com.medistock.service.SupplierService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public SupplierServiceImpl(SupplierRepository supplierRepository,
                               UserRepository userRepository,
                               MedicineRepository medicineRepository,
                               PurchaseOrderRepository purchaseOrderRepository,
                               NotificationService notificationService,
                               AuditLogService auditLogService) {
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Override
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Override
    public List<Supplier> getAllSuppliers(String search, SupplierStatus status) {
        List<Supplier> all = supplierRepository.findAll();
        return all.stream()
                .filter(s -> status == null || s.getStatus() == status)
                .filter(s -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String q = search.trim().toLowerCase();
                    return (s.getCompanyName() != null && s.getCompanyName().toLowerCase().contains(q)) ||
                           (s.getContactPerson() != null && s.getContactPerson().toLowerCase().contains(q)) ||
                           (s.getEmail() != null && s.getEmail().toLowerCase().contains(q)) ||
                           (s.getBusinessRegistrationNumber() != null && s.getBusinessRegistrationNumber().toLowerCase().contains(q));
                })
                .toList();
    }

    @Override
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
    }

    @Override
    public Supplier getSupplierByUserEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("User email cannot be empty.");
        }
        String cleanEmail = email.trim();
        return supplierRepository.findByUserEmail(cleanEmail)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(cleanEmail).orElse(null);
                    if (user != null) {
                        Optional<Supplier> byUserId = supplierRepository.findByUserId(user.getId());
                        if (byUserId.isPresent()) {
                            return byUserId.get();
                        }
                        if (user.getRole() == Role.SUPPLIER) {
                            Supplier autoSup = new Supplier(
                                    user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() + " Supplies" : "Supplier Enterprise",
                                    user.getFullName(),
                                    user.getEmail(),
                                    user.getPhone() != null ? user.getPhone() : "N/A",
                                    user.getAddress() != null ? user.getAddress() : "Hospital Supply District",
                                    "REG-" + user.getId(),
                                    SupplierStatus.APPROVED
                            );
                            autoSup.setUser(user);
                            return supplierRepository.save(autoSup);
                        }
                    }
                    throw new ResourceNotFoundException("Supplier profile not found for user email: " + email);
                });
    }

    @Override
    @Transactional
    public Supplier createSupplier(SupplierRequest request, String adminEmail) {
        if (supplierRepository.existsByEmail(request.getEmail().trim())) {
            throw new DuplicateResourceException("Supplier with email " + request.getEmail() + " already exists.");
        }

        Supplier supplier = new Supplier(
                request.getCompanyName(),
                request.getContactPerson(),
                request.getEmail().trim(),
                request.getPhone(),
                request.getAddress(),
                request.getBusinessRegistrationNumber(),
                SupplierStatus.APPROVED
        );
        supplier.setNotes(request.getNotes());
        Supplier saved = supplierRepository.save(supplier);

        auditLogService.log(adminEmail, Role.ADMIN.name(), "CREATE_SUPPLIER", "Supplier", saved.getId().toString(),
                "Created supplier " + saved.getCompanyName());
        return saved;
    }

    @Override
    @Transactional
    public Supplier updateSupplier(Long id, SupplierRequest request, String adminEmail) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        if (!supplier.getEmail().equalsIgnoreCase(request.getEmail().trim()) &&
                supplierRepository.existsByEmail(request.getEmail().trim())) {
            throw new DuplicateResourceException("Supplier with email " + request.getEmail() + " already exists.");
        }

        supplier.setCompanyName(request.getCompanyName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail().trim());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        supplier.setBusinessRegistrationNumber(request.getBusinessRegistrationNumber());
        if (request.getNotes() != null) supplier.setNotes(request.getNotes());

        Supplier updated = supplierRepository.save(supplier);
        auditLogService.log(adminEmail, Role.ADMIN.name(), "UPDATE_SUPPLIER", "Supplier", id.toString(),
                "Updated supplier " + updated.getCompanyName());
        return updated;
    }

    @Override
    @Transactional
    public Supplier updateSupplierStatus(Long id, SupplierStatusUpdateRequest request, String adminEmail) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        supplier.setStatus(request.getStatus());
        if (request.getNotes() != null) {
            supplier.setNotes(request.getNotes());
        }

        if (supplier.getUser() != null) {
            User user = supplier.getUser();
            if (request.getStatus() == SupplierStatus.APPROVED) {
                user.setStatus(UserStatus.ACTIVE);
            } else if (request.getStatus() == SupplierStatus.REJECTED) {
                user.setStatus(UserStatus.REJECTED);
            } else if (request.getStatus() == SupplierStatus.SUSPENDED) {
                user.setStatus(UserStatus.INACTIVE);
            }
            userRepository.save(user);

            notificationService.sendNotification(
                    user,
                    Role.SUPPLIER,
                    "Supplier Account Status Update",
                    "Your supplier account for " + supplier.getCompanyName() + " has been " + request.getStatus().name() + " by system administrator.",
                    NotificationType.SUPPLIER_APPROVAL
            );
        }

        Supplier updated = supplierRepository.save(supplier);
        auditLogService.log(adminEmail, Role.ADMIN.name(), "UPDATE_SUPPLIER_STATUS", "Supplier", id.toString(),
                "Updated supplier " + supplier.getCompanyName() + " status to " + request.getStatus().name());

        return updated;
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id, String adminEmail) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        supplierRepository.delete(supplier);
        auditLogService.log(adminEmail, Role.ADMIN.name(), "DELETE_SUPPLIER", "Supplier", id.toString(),
                "Deleted supplier " + supplier.getCompanyName());
    }

    @Override
    public List<Medicine> getSuppliedMedicines(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId).orElse(null);
        String companyName = supplier != null ? supplier.getCompanyName() : "";
        return medicineRepository.findSuppliedMedicines(supplierId, companyName, null, null, null);
    }

    @Override
    public List<Medicine> getSuppliedMedicines(Long supplierId, String companyName, String query, Long categoryId, com.medistock.enums.MedicineStatus status) {
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
        String compName = (companyName != null && !companyName.isBlank()) ? companyName.trim() : "";
        return medicineRepository.findSuppliedMedicines(supplierId, compName, cleanQuery, categoryId, status);
    }

    @Override
    public Page<PurchaseOrder> getSupplierOrders(Long supplierId, Pageable pageable) {
        return purchaseOrderRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId, pageable);
    }

    @Override
    @Transactional
    public Supplier updateSupplierOwnProfile(String email, UpdateProfileRequest request) {
        Supplier supplier = supplierRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found for user: " + email));

        if (request.getCompanyName() != null) supplier.setCompanyName(request.getCompanyName());
        if (request.getContactPerson() != null) supplier.setContactPerson(request.getContactPerson());
        if (request.getPhone() != null) supplier.setPhone(request.getPhone());
        if (request.getAddress() != null) supplier.setAddress(request.getAddress());
        if (request.getBusinessRegistrationNumber() != null) supplier.setBusinessRegistrationNumber(request.getBusinessRegistrationNumber());

        Supplier saved = supplierRepository.save(supplier);
        auditLogService.log(email, Role.SUPPLIER.name(), "UPDATE_SUPPLIER_PROFILE", "Supplier", saved.getId().toString(),
                "Supplier updated own profile");
        return saved;
    }

    @Override
    public void verifySupplierAccess(String userEmail, Long supplierId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.PHARMACIST) {
            return; // Authorized
        }

        if (user.getRole() == Role.SUPPLIER) {
            Supplier supplier = supplierRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ForbiddenException("No linked supplier profile found for your account."));
            if (!supplier.getId().equals(supplierId)) {
                throw new ForbiddenException("Access denied: You are not authorized to view or manage records belonging to another supplier.");
            }
            return;
        }

        throw new ForbiddenException("Access denied: Insufficient privileges to view supplier records.");
    }
}
