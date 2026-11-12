package com.medistock.medistock_backend.repository;

import com.medistock.medistock_backend.entity.StaffTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StaffTaskRepository extends JpaRepository<StaffTask, Long> {
    List<StaffTask> findByAssignedToIdOrderByCreatedAtDesc(Long userId);
    List<StaffTask> findByAssignedToIdAndStatus(Long userId, String status);
}