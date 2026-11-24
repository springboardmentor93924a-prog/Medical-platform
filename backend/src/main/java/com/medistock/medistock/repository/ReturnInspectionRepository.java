package com.medistock.medistock.repository;

import com.medistock.medistock.entity.ReturnInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnInspectionRepository extends JpaRepository<ReturnInspection, Integer> {

    List<ReturnInspection> findByMedicineReturn_ReturnIdOrderByInspectedAtDesc(Integer returnId);
}

