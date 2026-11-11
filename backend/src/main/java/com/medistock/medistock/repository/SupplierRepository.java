package com.medistock.medistock.repository;

import com.medistock.medistock.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    Optional<Supplier> findBySupplierName(String supplierName);

    Optional<Supplier> findBySupplierNameIgnoreCase(String supplierName);
}
