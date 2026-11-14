package com.medistock.service;

import com.medistock.dto.request.SupplierRequest;
import com.medistock.dto.request.SupplierStatusUpdateRequest;
import com.medistock.dto.request.UpdateProfileRequest;
import com.medistock.entity.Medicine;
import com.medistock.entity.PurchaseOrder;
import com.medistock.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SupplierService {
    List<Supplier> getAllSuppliers();
    List<Supplier> getAllSuppliers(String search, com.medistock.enums.SupplierStatus status);
    Supplier getSupplierById(Long id);
    Supplier getSupplierByUserEmail(String email);
    Supplier createSupplier(SupplierRequest request, String adminEmail);
    Supplier updateSupplier(Long id, SupplierRequest request, String adminEmail);
    Supplier updateSupplierStatus(Long id, SupplierStatusUpdateRequest request, String adminEmail);
    void deleteSupplier(Long id, String adminEmail);
    List<Medicine> getSuppliedMedicines(Long supplierId);
    List<Medicine> getSuppliedMedicines(Long supplierId, String companyName, String query, Long categoryId, com.medistock.enums.MedicineStatus status);
    Page<PurchaseOrder> getSupplierOrders(Long supplierId, Pageable pageable);
    Supplier updateSupplierOwnProfile(String email, UpdateProfileRequest request);
    void verifySupplierAccess(String userEmail, Long supplierId);
}
