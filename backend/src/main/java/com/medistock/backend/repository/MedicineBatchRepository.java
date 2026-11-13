package com.medistock.backend.repository;

import com.medistock.backend.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {
    boolean existsByMedicineIdAndBatchNumberIgnoreCase(Long medicineId, String batchNumber);
    boolean existsBySupplierId(Long supplierId);
    Optional<MedicineBatch> findByMedicineIdAndBatchNumberIgnoreCase(Long medicineId, String batchNumber);
}
