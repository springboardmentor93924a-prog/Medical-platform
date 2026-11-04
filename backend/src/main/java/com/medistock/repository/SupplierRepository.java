
package com.medistock.repository;

import com.medistock.entity.Supplier; 
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByActiveTrue();
    Optional<Supplier> findByEmailIgnoreCase(String email);
}
