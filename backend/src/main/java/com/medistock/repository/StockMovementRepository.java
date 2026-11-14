package com.medistock.repository;

import com.medistock.entity.StockMovement;
import com.medistock.enums.MovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    Page<StockMovement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.medicine.id = :medicineId ORDER BY sm.createdAt DESC")
    List<StockMovement> findByMedicineIdOrderByCreatedAtDesc(@Param("medicineId") Long medicineId);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.medicine.id = :medicineId ORDER BY sm.createdAt DESC")
    Page<StockMovement> findByMedicineId(@Param("medicineId") Long medicineId, Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.movementType = :movementType ORDER BY sm.createdAt DESC")
    Page<StockMovement> findByMovementType(@Param("movementType") MovementType movementType, Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.medicine.id = :medicineId AND sm.movementType = :movementType ORDER BY sm.createdAt DESC")
    Page<StockMovement> findByMedicineIdAndMovementType(@Param("medicineId") Long medicineId, @Param("movementType") MovementType movementType, Pageable pageable);

    long countByMovementType(MovementType movementType);
}
