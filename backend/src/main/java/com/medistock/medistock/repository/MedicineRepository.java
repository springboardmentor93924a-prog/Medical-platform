package com.medistock.medistock.repository;

import com.medistock.medistock.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Integer> {

    List<Medicine> findByCategoryId(Integer categoryId);

    long countByCategoryId(Integer categoryId);

    @Query("SELECT m FROM Medicine m WHERE " +
           "(:categoryId IS NULL OR m.categoryId = :categoryId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.genericName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.brandName) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Medicine> searchMedicines(@Param("search") String search, @Param("categoryId") Integer categoryId);
}
