package com.medistock.medistock.repository;

import com.medistock.medistock.entity.BackupSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BackupScheduleRepository extends JpaRepository<BackupSchedule, Integer> {

    List<BackupSchedule> findByEnabledTrue();

    Optional<BackupSchedule> findByFrequency(String frequency);

    List<BackupSchedule> findAllByOrderByScheduleIdAsc();
}

