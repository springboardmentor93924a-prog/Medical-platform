package com.medistock.service;

import com.medistock.entity.BackupRecord;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface BackupService {
    BackupRecord createBackup(String adminEmail);
    List<BackupRecord> getBackupHistory();
    Resource downloadBackup(Long id);
    Map<String, Object> restoreBackup(Long id, String adminEmail);
    Map<String, Object> restoreFromUpload(MultipartFile file, String adminEmail);
    void deleteBackup(Long id, String adminEmail);
}
