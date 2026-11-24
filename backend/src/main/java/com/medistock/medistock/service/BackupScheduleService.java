package com.medistock.medistock.service;

import com.medistock.medistock.dto.backup.BackupScheduleUpdateRequest;
import com.medistock.medistock.dto.backup.CreateBackupRequest;
import com.medistock.medistock.entity.BackupRecord;
import com.medistock.medistock.entity.BackupSchedule;
import com.medistock.medistock.repository.BackupRecordRepository;
import com.medistock.medistock.repository.BackupScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BackupScheduleService {

    private static final Logger log = LoggerFactory.getLogger(BackupScheduleService.class);

    private final BackupScheduleRepository backupScheduleRepository;
    private final BackupRecordRepository backupRecordRepository;
    private final DatabaseBackupService databaseBackupService;

    public BackupScheduleService(BackupScheduleRepository backupScheduleRepository,
                                 BackupRecordRepository backupRecordRepository,
                                 DatabaseBackupService databaseBackupService) {
        this.backupScheduleRepository = backupScheduleRepository;
        this.backupRecordRepository = backupRecordRepository;
        this.databaseBackupService = databaseBackupService;
    }

    public List<BackupSchedule> getAllSchedules() {
        return backupScheduleRepository.findAllByOrderByScheduleIdAsc();
    }

    @Transactional
    public BackupSchedule updateSchedule(Integer id, BackupScheduleUpdateRequest req) {
        BackupSchedule schedule = backupScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + id));

        if (req.getEnabled() != null) {
            schedule.setEnabled(req.getEnabled());
        }
        if (req.getScheduledTime() != null && !req.getScheduledTime().isBlank()) {
            schedule.setScheduledTime(req.getScheduledTime());
        }
        if (req.getRetentionDays() != null && req.getRetentionDays() > 0) {
            schedule.setRetentionDays(req.getRetentionDays());
        }
        schedule.setUpdatedAt(LocalDateTime.now().withNano(0));

        return backupScheduleRepository.save(schedule);
    }

    /**
     * Periodic scheduler engine (Runs every 10 minutes to evaluate pending schedules).
     */
    @Scheduled(cron = "0 */10 * * * ?")
    public void evaluateAndRunSchedules() {
        List<BackupSchedule> activeSchedules = backupScheduleRepository.findByEnabledTrue();
        LocalTime nowTime = LocalTime.now();
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        for (BackupSchedule schedule : activeSchedules) {
            try {
                LocalTime scheduled = LocalTime.parse(schedule.getScheduledTime(), timeFmt);
                // Check if within 15 minutes of scheduled time and hasn't run today
                boolean timeMatches = Math.abs(nowTime.toSecondOfDay() - scheduled.toSecondOfDay()) <= 900;
                boolean alreadyRanToday = schedule.getLastRunAt() != null &&
                        schedule.getLastRunAt().toLocalDate().isEqual(LocalDateTime.now().toLocalDate());

                if (timeMatches && !alreadyRanToday) {
                    log.info("Triggering automated backup schedule: {}", schedule.getScheduleName());
                    CreateBackupRequest req = new CreateBackupRequest();
                    req.setBackupName("Auto_" + schedule.getFrequency() + "_" + schedule.getScheduleName().replaceAll("\\s+", "_"));
                    req.setDescription("Automated backup executed by schedule: " + schedule.getScheduleName());
                    req.setScope("FULL_DATABASE");

                    BackupRecord record = databaseBackupService.createBackup(req, "AUTOMATIC_SCHEDULED", null);

                    schedule.setLastRunAt(LocalDateTime.now().withNano(0));
                    schedule.setLastStatus("SUCCESS: " + record.getBackupReference());
                    backupScheduleRepository.save(schedule);

                    // Execute retention cleanup
                    enforceRetentionPolicy(schedule.getRetentionDays());
                }
            } catch (Exception e) {
                log.error("Failed to run schedule {}: {}", schedule.getScheduleName(), e.getMessage());
                schedule.setLastStatus("FAILED: " + e.getMessage());
                backupScheduleRepository.save(schedule);
            }
        }
    }

    /**
     * Enforces backup retention policy by safely deleting expired automatic backups.
     * Never removes the latest verified backup or safety snapshots!
     */
    @Transactional
    public void enforceRetentionPolicy(int retentionDays) {
        if (retentionDays <= 0) return;
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);

        List<BackupRecord> expired = backupRecordRepository.findExpiredScheduledBackups(threshold);
        BackupRecord latestRecord = backupRecordRepository.findTopByOrderByCreatedAtDesc().orElse(null);

        for (BackupRecord record : expired) {
            // Safety guard: Never delete latest backup
            if (latestRecord != null && latestRecord.getBackupId().equals(record.getBackupId())) {
                continue;
            }
            // Safety guard: Never delete pre-restore snapshots
            if ("PRE_RESTORE".equalsIgnoreCase(record.getBackupType())) {
                continue;
            }

            try {
                File file = new File(record.getFileLocation());
                if (file.exists()) {
                    file.delete();
                }
                backupRecordRepository.delete(record);
                log.info("Retention cleanup: Removed expired backup {}", record.getBackupReference());
            } catch (Exception e) {
                log.warn("Failed to clean up expired backup {}: {}", record.getBackupReference(), e.getMessage());
            }
        }
    }
}

