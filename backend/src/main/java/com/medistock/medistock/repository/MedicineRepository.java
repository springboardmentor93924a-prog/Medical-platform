package com.medistock.medistock.repository;

import com.medistock.medistock.dto.InventoryReportDto;
import com.medistock.medistock.dto.MedicineCatalogDto;
import com.medistock.medistock.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Integer> {

    @Query("""
            SELECT new com.medistock.medistock.dto.MedicineCatalogDto(
                medicine.medicineId,
                medicine.medicineCode,
                medicine.medicineName,
                medicine.genericName,
                medicine.manufacturer,
                COALESCE(category.categoryName, medicine.category),
                medicine.dosage,
                medicine.prescriptionRequired,
                batch.batchId,
                batch.batchNumber,
                batch.quantity,
                batch.reorderLevel,
                batch.purchasePrice,
                batch.sellingPrice,
                batch.expiryDate,
                supplier.supplierName,
                supplier.contactPerson,
                supplier.contactNumber,
                supplier.email,
                supplier.supplierId,
                batch.rackLocation)
            FROM Medicine medicine
            LEFT JOIN medicine.categoryEntity category
            LEFT JOIN MedicineBatch batch ON batch.medicine = medicine
            LEFT JOIN batch.supplier supplier
            ORDER BY medicine.medicineName ASC, batch.expiryDate ASC
            """)
    List<MedicineCatalogDto> findAllCatalogRows();

    Optional<Medicine> findByMedicineName(String medicineName);

    Optional<Medicine> findByMedicineCodeIgnoreCase(String medicineCode);

    List<Medicine> findByCategory(String category);

    boolean existsByCategoryEntity_CategoryId(Integer categoryId);

    @Query("SELECT COUNT(m) FROM Medicine m")
    long countTotalMedicines();

    @Query("""
            SELECT new com.medistock.medistock.dto.InventoryReportDto(
                medicine.medicineId,
                medicine.medicineName,
                medicine.genericName,
                COALESCE(category.categoryName, medicine.category),
                batch.batchNumber,
                supplier.supplierName,
                batch.quantity,
                batch.reorderLevel,
                batch.purchasePrice,
                batch.sellingPrice,
                batch.expiryDate)
            FROM Medicine medicine
            LEFT JOIN medicine.categoryEntity category
            LEFT JOIN MedicineBatch batch ON batch.medicine = medicine
            LEFT JOIN batch.supplier supplier
            ORDER BY medicine.medicineName ASC, batch.expiryDate ASC
            """)
    List<InventoryReportDto> findAllInventoryReportRows();
}
