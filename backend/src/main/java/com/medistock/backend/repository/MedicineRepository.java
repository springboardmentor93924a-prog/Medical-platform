package com.medistock.backend.repository;

import com.medistock.backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByCategoryId(Long categoryId);
    Optional<Medicine> findByNameIgnoreCase(String name);
}
