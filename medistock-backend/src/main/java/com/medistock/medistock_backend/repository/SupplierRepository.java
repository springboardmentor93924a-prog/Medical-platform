package com.medistock.medistock_backend.repository;
import com.medistock.medistock_backend.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SupplierRepository extends JpaRepository<Supplier, Long> { }