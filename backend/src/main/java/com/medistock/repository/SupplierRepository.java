package com.medistock.repository;

import com.medistock.entity.Supplier;
import com.medistock.enums.SupplierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByEmail(String email);
    Optional<Supplier> findByCompanyNameIgnoreCase(String companyName);
    boolean existsByEmail(String email);

    @Query("SELECT s FROM Supplier s WHERE s.user.id = :userId")
    Optional<Supplier> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT s FROM Supplier s WHERE (s.user IS NOT NULL AND LOWER(s.user.email) = LOWER(:email)) OR LOWER(s.email) = LOWER(:email)")
    Optional<Supplier> findByUserEmail(@Param("email") String email);
    
    long countByStatus(SupplierStatus status);
    List<Supplier> findAllByStatus(SupplierStatus status);
}
