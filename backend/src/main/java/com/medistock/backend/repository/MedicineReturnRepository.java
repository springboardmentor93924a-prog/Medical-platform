package com.medistock.backend.repository;

import com.medistock.backend.entity.MedicineReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicineReturnRepository extends JpaRepository<MedicineReturn, Long> {
    List<MedicineReturn> findAllByOrderByCreatedAtDescIdDesc();
}
