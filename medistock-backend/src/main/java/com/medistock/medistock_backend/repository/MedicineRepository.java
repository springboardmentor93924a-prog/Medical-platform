package com.medistock.medistock_backend.repository;

import com.medistock.medistock_backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByNameContainingIgnoreCase(String name);

    // For Dashboard Stats
    List<Medicine> findByQuantityLessThanEqual(Integer minQuantity);
    List<Medicine> findByExpiryDateBefore(LocalDate date);
    boolean existsByBatchNumber(String batchNumber);
}