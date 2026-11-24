package com.medistock.medistock.repository;

import com.medistock.medistock.entity.BackupRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BackupRecordRepository extends JpaRepository<BackupRecord, Integer> {

    Optional<BackupRecord> findByBackupReference(String backupReference);

    boolean existsByBackupReference(String backupReference);

    List<BackupRecord> findAllByOrderByCreatedAtDesc();

    Page<BackupRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<BackupRecord> findTopByBackupStatusOrderByCreatedAtDesc(String backupStatus);

    Optional<BackupRecord> findTopByOrderByCreatedAtDesc();

    long countByBackupStatus(String backupStatus);

    @Query("SELECT COALESCE(SUM(b.fileSize), 0) FROM BackupRecord b WHERE b.backupStatus != 'FAILED'")
    long sumTotalStorageUsed();

    List<BackupRecord> findByCreatedAtBeforeAndBackupStatusNot(LocalDateTime threshold, String status);

    @Query("SELECT b FROM BackupRecord b WHERE b.backupType = 'AUTOMATIC_SCHEDULED' AND b.createdAt < :threshold ORDER BY b.createdAt ASC")
    List<BackupRecord> findExpiredScheduledBackups(LocalDateTime threshold);
}
