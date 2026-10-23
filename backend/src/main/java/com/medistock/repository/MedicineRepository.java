package com.medistock.repository;

import com.medistock.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicineRepository
        extends JpaRepository<Medicine, Long> {

    @Query("""
        SELECT m FROM Medicine m
        WHERE LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(m.category) LIKE LOWER(CONCAT('%', :q, '%'))
        ORDER BY m.medicineName
    """)
    Page<Medicine> search(@Param("q") String q, Pageable pageable);
}
