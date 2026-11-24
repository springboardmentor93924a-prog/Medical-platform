package com.medistock.medistock.repository;

import com.medistock.medistock.entity.AuditAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditAlertRepository extends JpaRepository<AuditAlert, Integer> {

    List<AuditAlert> findTop50ByOrderByCreatedAtDesc();

    Page<AuditAlert> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    long countByStatus(String status);
}
