package com.medistock.service;

import com.medistock.dto.request.MedicineRequest;
import com.medistock.entity.Medicine;
import com.medistock.enums.MedicineStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MedicineService {
    Page<Medicine> searchMedicines(String query, Long categoryId, Long supplierId, MedicineStatus status, Pageable pageable);
    List<Medicine> getAllMedicines();
    Medicine getMedicineById(Long id);
    Medicine createMedicine(MedicineRequest request, String userEmail);
    Medicine updateMedicine(Long id, MedicineRequest request, String userEmail);
    void deleteMedicine(Long id, String userEmail);
    List<Medicine> getLowStockMedicines();
    List<Medicine> getOutOfStockMedicines();
    List<Medicine> getNearExpiryMedicines();
    List<Medicine> getExpiredMedicines();
    void scanAndGenerateAlerts();
}
