package com.medistock.backend.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class BackupDtos {
    private BackupDtos() {}

    public record BackupFile(String name, long sizeKb, Instant modified) {}
    public record RestoreResult(Map<String, Integer> restored, String safetyCopy) {}
    public record BackupList(String folder, boolean dailyOn, List<BackupFile> files) {}
}
